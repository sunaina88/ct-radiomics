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
        
        else:  
            if model_type == "cnn":
                img_tensor = torch.FloatTensor(normalized_img).unsqueeze(0).unsqueeze(0)
                prediction, confidence, probabilities = loader.predict_mri_cnn(img_tensor)
                response["prediction"] = prediction
                response["confidence"] = confidence
                response["probabilities"] = {"Healthy": probabilities[0], "Tumor": probabilities[1]}
                
            elif model_type == "vit":
                img_tensor = torch.FloatTensor(normalized_img).unsqueeze(0).unsqueeze(0)
                img_tensor = (img_tensor - 0.5) / 0.5
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
    img_tensor_vit = (img_tensor_cnn - 0.5) / 0.5
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
            
        else: 
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
        # preprocess for ViT — normalize to [-1, 1]
        img_tensor = torch.FloatTensor(normalized_img).unsqueeze(0).unsqueeze(0)
        img_tensor = (img_tensor - 0.5) / 0.5
        img_tensor = img_tensor.to(loader.device)

        attentions = []

        def attn_hook(module, input, output):
            # output is (attn_output, attn_weights) when need_weights=True
            pass

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
        # shape per layer: [batch, heads, seq_len, seq_len]
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


@router.post("/shap-single")
async def shap_single(
    file: UploadFile = File(...),
    modality: str = Form(...)
):
    """
    Run SHAP on a single scan using the RF model.
    Returns top 6 feature names and their SHAP values for this specific scan.
    """
    if modality not in ["ct", "mri"]:
        raise HTTPException(status_code=400, detail="Modality must be 'ct' or 'mri'")

    try:
        image_bytes = await file.read()
        original_img, _ = preprocess(image_bytes, modality=modality)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")

    loader = get_loader()

    if modality == "ct":
        model = loader.ct_rf
        feature_cols = loader.ct_feature_cols
        label_encoder = loader.ct_label_encoder
    else:
        model = loader.mri_rf
        feature_cols = loader.mri_feature_cols
        label_encoder = loader.mri_label_encoder

    if model is None:
        raise HTTPException(status_code=500, detail=f"{modality.upper()} RF model not loaded")

    try:
        import shap

        features = extract_features(original_img)
        features_df = pd.DataFrame([features])[feature_cols].fillna(0)

        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(features_df)

        # handle both list and array formats
        if isinstance(shap_values, list):
            tumor_shap = shap_values[1][0]  # single scan, tumor class
        else:
            tumor_shap = shap_values[0, :, 1]

        # get feature values for this scan
        feature_values = features_df.iloc[0].to_dict()

        # build top 6 by absolute SHAP value
        shap_pairs = sorted(
            zip(feature_cols, tumor_shap),
            key=lambda x: abs(x[1]),
            reverse=True
        )[:6]

        top_features = [
            {
                "feature": name,
                "shap_value": float(val),
                "feature_value": float(feature_values.get(name, 0)),
                "direction": "tumor" if val > 0 else "healthy"
            }
            for name, val in shap_pairs
        ]

        return {
            "modality": modality,
            "top_features": top_features
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SHAP analysis failed: {str(e)}")


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
    """Generate a PDF report with the image, predictions and a clinical disclaimer."""

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
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
        doc = SimpleDocTemplate(pdf_buf, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)

        styles = getSampleStyleSheet()

        style_title = ParagraphStyle('Title', fontSize=20, fontName='Helvetica-Bold', textColor=colors.HexColor('#0A0E1A'), alignment=TA_CENTER, spaceAfter=4)
        style_subtitle = ParagraphStyle('Subtitle', fontSize=11, fontName='Helvetica', textColor=colors.HexColor('#6B7280'), alignment=TA_CENTER, spaceAfter=2)
        style_section = ParagraphStyle('Section', fontSize=12, fontName='Helvetica-Bold', textColor=colors.HexColor('#0A0E1A'), spaceBefore=14, spaceAfter=6)
        style_disclaimer = ParagraphStyle('Disclaimer', fontSize=8, fontName='Helvetica-Oblique', textColor=colors.HexColor('#9CA3AF'), spaceAfter=4, leading=13)

        predictions = [cnn_prediction, vit_prediction, rf_prediction]
        tumor_votes = predictions.count("Tumor")
        consensus = "Tumor Detected" if tumor_votes >= 2 else "No Tumor Detected"
        consensus_color = colors.HexColor('#EF4444') if tumor_votes >= 2 else colors.HexColor('#10B981')

        all_agree = len(set(predictions)) == 1
        disagreement_note = "" if all_agree else "Note: Models show disagreement — radiologist review strongly recommended."

        scan_date_display = scan_date if scan_date else datetime.now().strftime("%B %d, %Y")

        story = []
        story.append(Paragraph("Brain Tumor Classification", style_title))
        story.append(Paragraph("Clinical Decision Support Report", style_subtitle))
        story.append(Spacer(1, 0.3*cm))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E5E7EB')))
        story.append(Spacer(1, 0.4*cm))

        meta_data = [
            ["Patient", patient_name, "Scan Date", scan_date_display],
            ["Modality", modality.upper(), "Report Generated", datetime.now().strftime("%B %d, %Y %H:%M")],
        ]
        meta_table = Table(meta_data, colWidths=[3*cm, 6*cm, 3.5*cm, 5*cm])
        meta_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 0.4*cm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E5E7EB')))

        story.append(Paragraph("Consensus Result", style_section))
        consensus_style = ParagraphStyle('Consensus', fontSize=16, fontName='Helvetica-Bold', textColor=consensus_color, alignment=TA_CENTER, spaceAfter=4)
        story.append(Paragraph(consensus, consensus_style))
        story.append(Paragraph(f"{tumor_votes}/3 models detected tumor", ParagraphStyle('Votes', fontSize=10, fontName='Helvetica', textColor=colors.HexColor('#6B7280'), alignment=TA_CENTER, spaceAfter=4)))
        if disagreement_note:
            story.append(Paragraph(disagreement_note, ParagraphStyle('DisagreeNote', fontSize=9, fontName='Helvetica-Bold', textColor=colors.HexColor('#F59E0B'), alignment=TA_CENTER, spaceAfter=4)))

        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph("Model Predictions", style_section))

        def pred_color(pred):
            return colors.HexColor('#FEE2E2') if pred == "Tumor" else colors.HexColor('#D1FAE5')

        model_data = [
            ["Model", "Prediction", "Confidence", "Architecture"],
            ["CNN", cnn_prediction, f"{cnn_confidence*100:.1f}%", "4-layer ConvNet"],
            ["ViT", vit_prediction, f"{vit_confidence*100:.1f}%", "Vision Transformer"],
            ["RF", rf_prediction, f"{rf_confidence*100:.1f}%", "Radiomics + Random Forest"],
        ]
        model_table = Table(model_data, colWidths=[3*cm, 4*cm, 4*cm, 6.5*cm])
        model_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0A0E1A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
            ('BACKGROUND', (1, 1), (1, 1), pred_color(cnn_prediction)),
            ('BACKGROUND', (1, 2), (1, 2), pred_color(vit_prediction)),
            ('BACKGROUND', (1, 3), (1, 3), pred_color(rf_prediction)),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
            ('TOPPADDING', (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ]))
        story.append(model_table)

        story.append(Paragraph("Scan Image", style_section))
        scan_img = RLImage(img_buf, width=5*cm, height=5*cm)
        img_caption = Paragraph(f"{modality.upper()} scan — 64×64px preprocessed input", ParagraphStyle('Caption', fontSize=8, fontName='Helvetica-Oblique', textColor=colors.HexColor('#9CA3AF'), alignment=TA_CENTER))
        img_table = Table([[scan_img], [img_caption]], colWidths=[17.5*cm])
        img_table.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER'), ('TOPPADDING', (0, 0), (-1, -1), 4)]))
        story.append(img_table)

        story.append(Spacer(1, 0.4*cm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E5E7EB')))
        story.append(Spacer(1, 0.3*cm))

        disclaimer_text = (
            "DISCLAIMER: This report is generated by an AI system for research and "
            "educational purposes only. It is not a substitute for professional medical advice, "
            "diagnosis, or treatment. All findings must be reviewed and confirmed by a qualified "
            "radiologist or medical professional before any clinical decision is made. "
            "The AI models were trained on publicly available datasets and have not been validated "
            "for clinical use. Always seek the advice of your physician or other qualified health "
            "provider with any questions you may have regarding a medical condition."
        )
        story.append(Paragraph(disclaimer_text, style_disclaimer))

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