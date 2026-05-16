from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
import torch
import torch.nn.functional as F
import pandas as pd
import numpy as np
from utils.preprocessing import preprocess
from utils.feature_extractor import extract_features
from models.loader import ModelLoader
import io
import base64
import cv2

router = APIRouter()
loader = None

def get_loader():
    global loader
    if loader is None:
        loader = ModelLoader()
    return loader

@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    modality: str = Form(...),
    model_type: str = Form("cnn")
):
    """
    Predict tumor from CT or MRI image
    """

    if modality not in ["ct", "mri"]:
        raise HTTPException(status_code=400, detail="Modality must be 'ct' or 'mri'")
    
    if model_type not in ["cnn", "vit", "rf"]:
        raise HTTPException(status_code=400, detail="Model type must be 'cnn', 'vit', or 'rf'")
    
    try:
        image_bytes = await file.read()
        original_img, normalized_img = preprocess(image_bytes, modality=modality)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")
    
    loader = get_loader()

    response = {
        "modality": modality,
        "model_type": model_type,
        "image_shape": list(original_img.shape)
    }

    try:
        if modality == "ct":
            if model_type == "cnn":
                img_tensor = torch.FloatTensor(normalized_img).unsqueeze(0).unsqueeze(0)
                prediction, confidence, probabilities = loader.predict_ct_cnn(img_tensor)
                response["prediction"] = prediction
                response["confidence"] = confidence
                response["probabilities"] = {"Healthy": probabilities[0], "Tumor": probabilities[1]}
                
            elif model_type == "vit":
                img_tensor = torch.FloatTensor(normalized_img).unsqueeze(0).unsqueeze(0)
                img_tensor = (img_tensor - 0.5) / 0.5
                prediction, confidence, probabilities = loader.predict_ct_vit(img_tensor)
                response["prediction"] = prediction
                response["confidence"] = confidence
                response["probabilities"] = {"Healthy": probabilities[0], "Tumor": probabilities[1]}

            elif model_type == "rf":
                features = extract_features(original_img)
                features_df = pd.DataFrame([features])
                prediction, confidence, probabilities = loader.predict_ct_rf(features_df)
                response["prediction"] = prediction
                response["confidence"] = confidence
                response["probabilities"] = {"Healthy": probabilities[0], "Tumor": probabilities[1]}
                response["radiomics_features"] = {k: float(v) for k, v in features.items()}
        
        else:  # MRI
            if model_type == "cnn":
                img_tensor = torch.FloatTensor(normalized_img).unsqueeze(0).unsqueeze(0)
                prediction, confidence, probabilities = loader.predict_mri_cnn(img_tensor)
                response["prediction"] = prediction
                response["confidence"] = confidence
                response["probabilities"] = {"Healthy": probabilities[0], "Tumor": probabilities[1]}
                
            elif model_type == "vit":
                img_tensor = torch.FloatTensor(normalized_img).unsqueeze(0).unsqueeze(0)
                # MRI already normalized correctly by preprocess, no extra transform needed
                prediction, confidence, probabilities = loader.predict_mri_vit(img_tensor)
                response["prediction"] = prediction
                response["confidence"] = confidence
                response["probabilities"] = {"Healthy": probabilities[0], "Tumor": probabilities[1]}
                
            elif model_type == "rf":
                features = extract_features(original_img)
                features_df = pd.DataFrame([features])
                prediction, confidence, probabilities = loader.predict_mri_rf(features_df)
                response["prediction"] = prediction
                response["confidence"] = confidence
                response["probabilities"] = {"Healthy": probabilities[0], "Tumor": probabilities[1]}
                response["radiomics_features"] = {k: float(v) for k, v in features.items()}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    
    return response


@router.post("/predict-all")
async def predict_all(
    file: UploadFile = File(...),
    modality: str = Form(...) 
):
    """
    Run all three models (CNN, ViT, RF) and return all predictions
    """
    
    if modality not in ["ct", "mri"]:
        raise HTTPException(status_code=400, detail="Modality must be 'ct' or 'mri'")
    
    try:
        image_bytes = await file.read()
        original_img, normalized_img = preprocess(image_bytes, modality=modality)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")
    
    loader = get_loader()
    
    img_tensor_cnn = torch.FloatTensor(normalized_img).unsqueeze(0).unsqueeze(0)
    
    # For ViT: CT needs (x-0.5)/0.5, MRI is already normalized correctly
    if modality == "ct":
        img_tensor_vit = (img_tensor_cnn - 0.5) / 0.5
    else:
        img_tensor_vit = img_tensor_cnn.clone()
    
    features = extract_features(original_img)
    features_df = pd.DataFrame([features])
    results = {"modality": modality}
    
    try:
        if modality == "ct":
            pred, conf, probs = loader.predict_ct_cnn(img_tensor_cnn)
            results["cnn"] = {"prediction": pred, "confidence": conf, "probabilities": {"Healthy": probs[0], "Tumor": probs[1]}}
            pred, conf, probs = loader.predict_ct_vit(img_tensor_vit)
            results["vit"] = {"prediction": pred, "confidence": conf, "probabilities": {"Healthy": probs[0], "Tumor": probs[1]}}
            pred, conf, probs = loader.predict_ct_rf(features_df)
            results["rf"] = {"prediction": pred, "confidence": conf, "probabilities": {"Healthy": probs[0], "Tumor": probs[1]}}
            results["radiomics_features"] = {k: float(v) for k, v in features.items()}
            
        else:  # MRI
            pred, conf, probs = loader.predict_mri_cnn(img_tensor_cnn)
            results["cnn"] = {"prediction": pred, "confidence": conf, "probabilities": {"Healthy": probs[0], "Tumor": probs[1]}}
            pred, conf, probs = loader.predict_mri_vit(img_tensor_vit)
            results["vit"] = {"prediction": pred, "confidence": conf, "probabilities": {"Healthy": probs[0], "Tumor": probs[1]}}
            pred, conf, probs = loader.predict_mri_rf(features_df)
            results["rf"] = {"prediction": pred, "confidence": conf, "probabilities": {"Healthy": probs[0], "Tumor": probs[1]}}
            results["radiomics_features"] = {k: float(v) for k, v in features.items()}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    
    return results


@router.post("/gradcam")
async def gradcam(
    file: UploadFile = File(...),
    modality: str = Form(...)
):
    """Generate a Grad-CAM heatmap using CNN"""
    if modality not in ["ct", "mri"]:
        raise HTTPException(status_code=400, detail="Modality must be 'ct' or 'mri'")
    try:
        image_bytes = await file.read()
        original_img, normalized_img = preprocess(image_bytes, modality=modality)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")
    
    loader = get_loader()
    model = loader.ct_cnn if modality == "ct" else loader.mri_cnn

    if model is None:
        raise HTTPException(status_code=500, detail=f"{modality.upper()} CNN model not loaded")
    
    try:
        img_tensor = torch.FloatTensor(normalized_img).unsqueeze(0).unsqueeze(0)
        img_tensor = img_tensor.to(loader.device)
        img_tensor.requires_grad_(False)
        gradients = []
        activations = []

        def forward_hook(module, input, output):
            activations.append(output)

        def backward_hook(module, grad_input, grad_output):
            gradients.append(grad_output[0])

        target_layer = model.conv4
        fh = target_layer.register_forward_hook(forward_hook)
        bh = target_layer.register_full_backward_hook(backward_hook)
        model.eval()
        output = model(img_tensor)
        pred_class = output.argmax(dim=1).item()
        model.zero_grad()
        output[0, pred_class].backward()
        fh.remove()
        bh.remove()

        grads = gradients[0].cpu().detach().numpy()[0]
        acts = activations[0].cpu().detach().numpy()[0]
        weights = grads.mean(axis=(1, 2))
        cam = np.zeros(acts.shape[1:], dtype=np.float32)
        for i, w in enumerate(weights):
            cam += w * acts[i]

        cam = np.maximum(cam, 0)
        if cam.max() > 0:
            cam = cam / cam.max()

        img_display = original_img.copy()
        if img_display.max() <= 1.0:
            img_display = (img_display * 255).astype(np.uint8)
        else:
            img_display = img_display.astype(np.uint8)

        cam_resized = cv2.resize(cam, (img_display.shape[1], img_display.shape[0]))
        heatmap = cv2.applyColorMap((cam_resized * 255).astype(np.uint8), cv2.COLORMAP_JET)

        if len(img_display.shape) == 2:
            img_rgb = cv2.cvtColor(img_display, cv2.COLOR_GRAY2RGB)
        else:
            img_rgb = img_display

        overlay = cv2.addWeighted(img_rgb, 0.6, heatmap, 0.4, 0)
        _, orig_buf = cv2.imencode(".png", img_rgb)
        _, overlay_buf = cv2.imencode(".png", overlay)
        original_b64 = base64.b64encode(orig_buf.tobytes()).decode("utf-8")
        overlay_b64 = base64.b64encode(overlay_buf.tobytes()).decode("utf-8")

        return {
            "modality": modality,
            "predicted_class": "Tumor" if pred_class == 1 else "Healthy",
            "original_image": f"data:image/png;base64,{original_b64}",
            "heatmap_overlay": f"data:image/png;base64,{overlay_b64}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grad-CAM failed: {str(e)}")


@router.post("/attention")
async def attention(
    file: UploadFile = File(...),
    modality: str = Form(...)
):
    """
    Generate ViT attention map for the uploaded scan.
    Returns original image and attention overlay as base64 strings.
    """
    if modality not in ["ct", "mri"]:
        raise HTTPException(status_code=400, detail="Modality must be 'ct' or 'mri'")

    try:
        image_bytes = await file.read()
        original_img, normalized_img = preprocess(image_bytes, modality=modality)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")

    loader = get_loader()
    model = loader.ct_vit if modality == "ct" else loader.mri_vit

    if model is None:
        raise HTTPException(status_code=500, detail=f"{modality.upper()} ViT model not loaded")

    try:
        # prepare tensor for ViT
        img_tensor = torch.FloatTensor(normalized_img).unsqueeze(0).unsqueeze(0)
        # CT needs (x-0.5)/0.5 normalization, MRI already normalized correctly by preprocess
        if modality == "ct":
            img_tensor = (img_tensor - 0.5) / 0.5
        img_tensor = img_tensor.to(loader.device)

        # manually extract attention from each transformer layer
        attn_weights_list = []
        x = model.patch_embed(img_tensor)
        batch_size = x.shape[0]
        cls_tokens = model.cls_token.expand(batch_size, -1, -1)
        x = torch.cat([cls_tokens, x], dim=1)
        x = x + model.pos_embed
        x = model.pos_dropout(x)

        with torch.no_grad():
            for layer in model.transformer.layers:
                attn_out, attn_w = layer.self_attn(
                    x, x, x,
                    need_weights=True,
                    average_attn_weights=False
                )
                attn_weights_list.append(attn_w)
                # complete the rest of the layer manually
                x = x + layer.dropout1(attn_out)
                x = layer.norm1(x)
                x2 = layer.linear2(layer.dropout(layer.activation(layer.linear1(x))))
                x = x + layer.dropout2(x2)
                x = layer.norm2(x)

        # average attention across layers and heads, extract cls token attention to patches
        attn_stack = torch.stack(attn_weights_list)  # [layers, batch, heads, seq, seq]
        attn_mean = attn_stack.mean(dim=0).mean(dim=1)  # [batch, seq, seq]
        cls_attn = attn_mean[0, 0, 1:]  # cls token attention to all patches: [64]

        n_patches = 8
        attn_grid = cls_attn.cpu().numpy().reshape(n_patches, n_patches)

        # normalize attention map
        attn_norm = (attn_grid - attn_grid.min()) / (attn_grid.max() - attn_grid.min() + 1e-8)

        # prepare original image for display
        img_display = original_img.copy()
        if img_display.max() <= 1.0:
            img_display = (img_display * 255).astype(np.uint8)
        else:
            img_display = img_display.astype(np.uint8)

        h, w = img_display.shape[:2]
        attn_resized = cv2.resize(attn_norm, (w, h))
        attn_colored = cv2.applyColorMap((attn_resized * 255).astype(np.uint8), cv2.COLORMAP_JET)

        if len(img_display.shape) == 2:
            img_rgb = cv2.cvtColor(img_display, cv2.COLOR_GRAY2RGB)
        else:
            img_rgb = img_display.copy()

        # denormalize for display
        img_display_norm = (img_display.astype(np.float32) / 255.0)
        img_rgb_proper = (img_display_norm * 255).astype(np.uint8)
        if len(img_rgb_proper.shape) == 2:
            img_rgb_proper = cv2.cvtColor(img_rgb_proper, cv2.COLOR_GRAY2RGB)

        overlay = cv2.addWeighted(img_rgb_proper, 0.5, attn_colored, 0.5, 0)

        _, orig_buf = cv2.imencode(".png", img_rgb_proper)
        _, overlay_buf = cv2.imencode(".png", overlay)

        original_b64 = base64.b64encode(orig_buf.tobytes()).decode("utf-8")
        overlay_b64 = base64.b64encode(overlay_buf.tobytes()).decode("utf-8")

        return {
            "modality": modality,
            "original_image": f"data:image/png;base64,{original_b64}",
            "attention_overlay": f"data:image/png;base64,{overlay_b64}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Attention map failed: {str(e)}")


@router.post("/generate-report")
async def generate_report(
    file: UploadFile = File(...),
    modality: str = Form(...),
    cnn_prediction: str = Form(...),
    cnn_confidence: float = Form(...),
    vit_prediction: str = Form(...),
    vit_confidence: float = Form(...),
    rf_prediction: str = Form(...),
    rf_confidence: float = Form(...),
    patient_name: str = Form(default="Anonymous"),
    scan_date: str = Form(default="")
):
    """Generate a professional clinical PDF report — Times New Roman, no colour fills."""

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table,
            TableStyle, Image as RLImage, HRFlowable
        )
        from reportlab.lib.styles import ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
        from datetime import datetime
        import PIL.Image
    except ImportError:
        raise HTTPException(status_code=500, detail="reportlab not installed.")

    try:
        image_bytes = await file.read()
        original_img, _ = preprocess(image_bytes, modality=modality)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")

    try:
        # prepare scan image
        if original_img.max() <= 1.0:
            img_display = (original_img * 255).astype(np.uint8)
        else:
            img_display = original_img.astype(np.uint8)

        if len(img_display.shape) == 2:
            pil_img = PIL.Image.fromarray(img_display, mode='L').convert('RGB')
        else:
            pil_img = PIL.Image.fromarray(img_display)

        pil_img = pil_img.resize((200, 200), PIL.Image.LANCZOS)
        img_buf = io.BytesIO()
        pil_img.save(img_buf, format='PNG')
        img_buf.seek(0)

        pdf_buf = io.BytesIO()
        doc = SimpleDocTemplate(
            pdf_buf, pagesize=A4,
            rightMargin=2.5*cm, leftMargin=2.5*cm,
            topMargin=2*cm, bottomMargin=2.5*cm
        )

        BLACK = colors.black
        DARK  = colors.HexColor('#1a1a1a')
        MID   = colors.HexColor('#444444')

        # ── styles — all Times New Roman, monochrome ──────────────────────
        style_title = ParagraphStyle(
            'Title', fontName='Times-Bold', fontSize=16,
            textColor=BLACK, alignment=TA_CENTER, spaceAfter=3
        )
        style_subtitle = ParagraphStyle(
            'Subtitle', fontName='Times-Italic', fontSize=10,
            textColor=MID, alignment=TA_CENTER, spaceAfter=2
        )
        style_section = ParagraphStyle(
            'Section', fontName='Times-Bold', fontSize=11,
            textColor=BLACK, spaceBefore=12, spaceAfter=5
        )
        style_body = ParagraphStyle(
            'Body', fontName='Times-Roman', fontSize=10,
            textColor=DARK, alignment=TA_JUSTIFY,
            spaceAfter=6, leading=15
        )
        style_body_bold = ParagraphStyle(
            'BodyBold', fontName='Times-Bold', fontSize=10,
            textColor=BLACK, spaceAfter=4
        )
        style_small = ParagraphStyle(
            'Small', fontName='Times-Roman', fontSize=8,
            textColor=MID, alignment=TA_JUSTIFY,
            spaceAfter=3, leading=12
        )
        style_small_it = ParagraphStyle(
            'SmallIt', fontName='Times-Italic', fontSize=8,
            textColor=MID, alignment=TA_JUSTIFY,
            spaceAfter=3, leading=12
        )
        style_caption = ParagraphStyle(
            'Caption', fontName='Times-Italic', fontSize=8,
            textColor=MID, alignment=TA_CENTER, spaceAfter=2
        )
        style_consensus = ParagraphStyle(
            'Consensus', fontName='Times-Bold', fontSize=15,
            textColor=BLACK, alignment=TA_CENTER, spaceAfter=3
        )

        # ── data ──────────────────────────────────────────────────────────
        predictions  = [cnn_prediction, vit_prediction, rf_prediction]
        tumor_votes  = predictions.count("Tumor")
        consensus    = "TUMOR DETECTED" if tumor_votes >= 2 else "NO TUMOR DETECTED"
        all_agree    = len(set(predictions)) == 1
        scan_date_display = scan_date if scan_date else datetime.now().strftime("%d %B %Y")
        report_ts    = datetime.now().strftime("%d %B %Y, %H:%M")

        def conf_pct(c):
            return f"{c*100:.1f}%" if c <= 1 else f"{c:.1f}%"

        story = []

        # ── HEADER ────────────────────────────────────────────────────────
        story.append(Paragraph("BRAIN TUMOUR CLASSIFICATION REPORT", style_title))
        story.append(Paragraph("Clinical Decision Support System — Research Use Only", style_subtitle))
        story.append(HRFlowable(width="100%", thickness=1.5, color=BLACK, spaceAfter=6))

        # patient meta table
        meta_data = [
            ["Patient",     patient_name,    "Scan Date",      scan_date_display],
            ["Modality",    modality.upper(), "Report Date",    report_ts],
            ["Institution", "—",             "Ref. Radiologist","—"],
        ]
        meta_table = Table(meta_data, colWidths=[3*cm, 5.5*cm, 3.5*cm, 4*cm])
        meta_table.setStyle(TableStyle([
            ('FONTNAME',     (0,0), (-1,-1), 'Times-Roman'),
            ('FONTNAME',     (0,0), (0,-1),  'Times-Bold'),
            ('FONTNAME',     (2,0), (2,-1),  'Times-Bold'),
            ('FONTSIZE',     (0,0), (-1,-1), 9),
            ('TEXTCOLOR',    (0,0), (-1,-1), DARK),
            ('TOPPADDING',   (0,0), (-1,-1), 3),
            ('BOTTOMPADDING',(0,0), (-1,-1), 3),
            ('LINEBELOW',    (0,-1),(-1,-1), 0.5, colors.HexColor('#aaaaaa')),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 0.4*cm))

        # ── 1. CONSENSUS ──────────────────────────────────────────────────
        story.append(Paragraph("1. CONSENSUS RESULT", style_section))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#aaaaaa'), spaceAfter=6))
        story.append(Paragraph(consensus, style_consensus))
        story.append(Paragraph(
            f"{tumor_votes} of 3 independent models identified a tumour in this scan.",
            ParagraphStyle('cvotes', fontName='Times-Roman', fontSize=9,
                           textColor=MID, alignment=TA_CENTER, spaceAfter=4)
        ))
        if not all_agree:
            story.append(Paragraph(
                "Warning: Model predictions are not unanimous. Independent radiologist "
                "review is strongly recommended before any clinical action.",
                ParagraphStyle('warn', fontName='Times-BoldItalic', fontSize=9,
                               textColor=BLACK, alignment=TA_CENTER, spaceAfter=6)
            ))

        # ── 2. MODEL PREDICTIONS TABLE ────────────────────────────────────
        story.append(Paragraph("2. MODEL PREDICTIONS", style_section))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#aaaaaa'), spaceAfter=6))
        story.append(Paragraph(
            "Three independent analytical pipelines were applied to the uploaded scan. "
            "Each model operates on distinct principles, providing complementary evidence "
            "that reduces the risk of systematic error.",
            style_body
        ))

        pred_data = [
            ["Model", "Architecture", "Prediction", "Confidence", "Accuracy"],
            ["CNN",  "4-layer ConvNet",            cnn_prediction, conf_pct(cnn_confidence),
             "98.5% (CT) / 98.5% (MRI)"],
            ["ViT",  "Vision Transformer, 4 layers", vit_prediction, conf_pct(vit_confidence),
             "97.2% (CT) / 97.3% (MRI)"],
            ["RF",   "Random Forest, 30 features",  rf_prediction,  conf_pct(rf_confidence),
             "89.2% (CT) / 92.7% (MRI)"],
        ]
        pred_table = Table(pred_data, colWidths=[1.5*cm, 4.5*cm, 2.8*cm, 2.5*cm, 4.7*cm])
        pred_table.setStyle(TableStyle([
            ('FONTNAME',     (0,0), (-1,0),  'Times-Bold'),
            ('FONTNAME',     (0,1), (-1,-1), 'Times-Roman'),
            ('FONTSIZE',     (0,0), (-1,-1), 9),
            ('TEXTCOLOR',    (0,0), (-1,-1), DARK),
            ('ALIGN',        (0,0), (-1,-1), 'LEFT'),
            ('ALIGN',        (2,0), (3,-1),  'CENTER'),
            ('TOPPADDING',   (0,0), (-1,-1), 4),
            ('BOTTOMPADDING',(0,0), (-1,-1), 4),
            ('LINEBELOW',    (0,0), (-1,0),  1,   BLACK),
            ('LINEBELOW',    (0,1), (-1,-1), 0.3, colors.HexColor('#cccccc')),
            ('ROWBACKGROUNDS',(0,1),(-1,-1), [colors.white, colors.HexColor('#f5f5f5')]),
            ('BOX',          (0,0), (-1,-1), 0.5, colors.HexColor('#aaaaaa')),
        ]))
        story.append(pred_table)
        story.append(Spacer(1, 0.3*cm))

        # ── 3. MODEL REASONING ────────────────────────────────────────────
        story.append(Paragraph("3. MODEL REASONING AND INTERPRETATION", style_section))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#aaaaaa'), spaceAfter=6))

        cnn_txt = (
            f"<b>Convolutional Neural Network (CNN)</b> — "
            f"Prediction: <b>{cnn_prediction}</b>, Confidence: <b>{conf_pct(cnn_confidence)}</b>. "
            f"The CNN applies learnable spatial filters across four convolutional blocks, detecting "
            f"progressively complex features from edges and gradients in early layers to textural and "
            f"structural patterns in deeper layers. Batch normalisation and dropout regularisation are "
            f"applied throughout to improve generalisation. The model was trained on "
            f"{'4,618 CT' if modality == 'ct' else '5,000 MRI'} images and achieves 98.5% test accuracy "
            f"with an AUC of {'0.996' if modality == 'ct' else '0.998'}. "
            + ("High confidence indicates strong visual evidence consistent with the training distribution."
               if cnn_confidence > 0.85 else
               "Moderate confidence suggests borderline visual characteristics — interpret with caution.")
        )
        story.append(Paragraph(cnn_txt, style_body))

        vit_txt = (
            f"<b>Vision Transformer (ViT)</b> — "
            f"Prediction: <b>{vit_prediction}</b>, Confidence: <b>{conf_pct(vit_confidence)}</b>. "
            f"The ViT divides the scan into 64 non-overlapping 8×8 pixel patches and processes all patches "
            f"simultaneously using self-attention across four transformer layers. Unlike the CNN, the ViT "
            f"captures long-range spatial dependencies across the entire image, making it sensitive to "
            f"global structural abnormalities. It achieves {'97.2%' if modality == 'ct' else '97.3%'} "
            f"accuracy with an AUC of {'0.991' if modality == 'ct' else '0.989'}. "
            + ("Agreement with the CNN reinforces the finding."
               if cnn_prediction == vit_prediction else
               "Disagreement with the CNN suggests global and local features give conflicting evidence.")
        )
        story.append(Paragraph(vit_txt, style_body))

        rf_txt = (
            f"<b>Random Forest — Radiomics (RF)</b> — "
            f"Prediction: <b>{rf_prediction}</b>, Confidence: <b>{conf_pct(rf_confidence)}</b>. "
            f"The RF operates on 30 hand-crafted radiomics features: intensity statistics (mean, entropy, "
            f"skewness, kurtosis), GLCM texture descriptors (contrast, homogeneity, correlation, energy), "
            f"and shape measurements (solidity, eccentricity, roundness, aspect ratio). This model is "
            f"fully interpretable — its decision is attributable to specific, clinically meaningful image "
            f"properties. It achieves {'89.2%' if modality == 'ct' else '92.7%'} accuracy with an AUC of "
            f"{'0.925' if modality == 'ct' else '0.962'}."
        )
        story.append(Paragraph(rf_txt, style_body))

        # ensemble
        story.append(Paragraph("Ensemble Agreement", style_body_bold))
        if all_agree:
            ensemble_txt = (
                f"All three models unanimously predicted {predictions[0]}. Unanimous consensus across "
                f"architecturally distinct models substantially reduces the probability of a false result."
            )
        else:
            ensemble_txt = (
                f"The models do not unanimously agree (CNN: {cnn_prediction}, ViT: {vit_prediction}, "
                f"RF: {rf_prediction}). Disagreement may indicate borderline imaging characteristics, "
                f"image artefacts, or a case at the boundary of the training distribution. "
                f"Independent radiologist review is essential."
            )
        story.append(Paragraph(ensemble_txt, style_body))

        # ── 4. SCAN IMAGE ─────────────────────────────────────────────────
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#aaaaaa'), spaceAfter=4))
        story.append(Paragraph("4. SCAN IMAGE", style_section))
        story.append(Paragraph(
            "The image below shows the uploaded scan after preprocessing (resized to 64×64 pixels, "
            "grayscale normalisation applied). This is the exact input received by all three models.",
            style_body
        ))

        scan_img_obj = RLImage(img_buf, width=4.5*cm, height=4.5*cm)
        img_tbl = Table([[scan_img_obj]], colWidths=[16*cm])
        img_tbl.setStyle(TableStyle([
            ('ALIGN',        (0,0), (-1,-1), 'CENTER'),
            ('BOX',          (0,0), (-1,-1), 0.5, colors.HexColor('#aaaaaa')),
            ('TOPPADDING',   (0,0), (-1,-1), 6),
            ('BOTTOMPADDING',(0,0), (-1,-1), 6),
        ]))
        story.append(img_tbl)
        story.append(Paragraph(
            f"Figure 1. Preprocessed {modality.upper()} scan submitted for analysis.",
            style_caption
        ))

        # ── 5. LIMITATIONS ────────────────────────────────────────────────
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#aaaaaa'), spaceAfter=4))
        story.append(Paragraph("5. LIMITATIONS", style_section))
        for lim in [
            "Models were trained on publicly available datasets and have not been prospectively validated in a clinical setting.",
            "Training data does not include demographic annotations; generalisation to specific patient populations has not been assessed.",
            "Input images are resized to 64×64 pixels; fine structural detail present in the original scan may be lost.",
            "Confidence scores reflect softmax outputs and are not calibrated probability estimates.",
            "This system detects tumour presence only. It does not classify tumour type, grade, or anatomical location.",
        ]:
            story.append(Paragraph(f"• {lim}", style_small))

        # ── DISCLAIMER ────────────────────────────────────────────────────
        story.append(HRFlowable(width="100%", thickness=1.2, color=BLACK, spaceBefore=10, spaceAfter=4))
        story.append(Paragraph(
            "DISCLAIMER — FOR RESEARCH AND EDUCATIONAL USE ONLY",
            ParagraphStyle('dhead', fontName='Times-Bold', fontSize=8,
                           textColor=BLACK, alignment=TA_CENTER, spaceAfter=3)
        ))
        story.append(Paragraph(
            "This report has been generated automatically by an artificial intelligence system and is provided "
            "solely for research and educational purposes. It does not constitute a medical diagnosis, clinical "
            "opinion, or recommendation for treatment. All findings must be independently reviewed and confirmed "
            "by a qualified radiologist or medical professional before any clinical decision is made. The system "
            "has not been approved by any regulatory authority for clinical deployment. The authors and developers "
            "of this system accept no liability for decisions made on the basis of this report.",
            style_small_it
        ))

        doc.build(story)
        pdf_buf.seek(0)

        filename = f"brainscan_report_{patient_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        return StreamingResponse(
            pdf_buf,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.get("/models")
async def get_available_models():
    """Return a list of available models with their accuracy"""
    return {
        "modalities": ["ct", "mri"],
        "models": ["cnn", "vit", "rf"],
        "descriptions": {
            "cnn": "Convolutional Neural Network - Best for local patterns",
            "vit": "Vision Transformer - Best for global patterns",
            "rf": "Random Forest - Interpretable radiomics features"
        },
        "accuracy": {
            "ct_cnn": 98.1,
            "ct_vit": 97.2,
            "ct_rf": 89.2,
            "mri_cnn": 98.5,
            "mri_vit": 97.3,
            "mri_rf": 92.7
        }
    }


@router.get("/health")
async def health_check():
    """Check if models are loaded"""
    loader = get_loader()
    return {
        "status": "healthy",
        "models_loaded": {
            "ct_cnn": loader.ct_cnn is not None,
            "ct_vit": loader.ct_vit is not None,
            "ct_rf": loader.ct_rf is not None,
            "mri_cnn": loader.mri_cnn is not None,
            "mri_vit": loader.mri_vit is not None,
            "mri_rf": loader.mri_rf is not None
        }
    }