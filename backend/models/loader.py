import torch
import torch.nn as nn
import joblib
import os

# CNN architecture
class TumorCNN(nn.Module):
    def __init__(self):
        super(TumorCNN, self).__init__()
        
        # convolutional layers
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)
        self.conv4 = nn.Conv2d(128, 256, kernel_size=3, padding=1)
        self.bn4 = nn.BatchNorm2d(256)
        
        # pooling
        self.pool = nn.MaxPool2d(2, 2)
        
        # dropout for regularization
        self.dropout = nn.Dropout(0.3)
        
        self.fc1 = nn.Linear(256 * 4 * 4, 512)
        self.fc2 = nn.Linear(512, 256)
        self.fc3 = nn.Linear(256, 2)  
        
        self.relu = nn.ReLU()
    
    def forward(self, x):
        # conv block 1
        x = self.relu(self.bn1(self.conv1(x)))
        x = self.pool(x)
        
        # conv block 2
        x = self.relu(self.bn2(self.conv2(x)))
        x = self.pool(x)
        
        # conv block 3
        x = self.relu(self.bn3(self.conv3(x)))
        x = self.pool(x)
        
        # conv block 4
        x = self.relu(self.bn4(self.conv4(x)))
        x = self.pool(x)
        
        # flatten
        x = x.view(x.size(0), -1)
        
        # fully connected layers
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.fc3(x)
        
        return x
    
# ViT architecture
class PatchEmbedding(nn.Module):
    """Convert images to patches and embed them"""
    def __init__(self, img_size=64, patch_size=8, in_channels=1, embed_dim=128):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.n_patches = (img_size // patch_size) ** 2
        self.proj = nn.Conv2d(in_channels, embed_dim, kernel_size=patch_size, stride=patch_size)
    
    def forward(self, x):
        x = self.proj(x)  
        x = x.flatten(2)  
        x = x.transpose(1, 2)  
        return x

class VisionTransformer(nn.Module):
    def __init__(self, img_size=64, patch_size=8, in_channels=1, num_classes=2,
                 embed_dim=128, num_heads=4, num_layers=4, dropout=0.1):
        super().__init__()
        
        # patch embedding
        self.patch_embed = PatchEmbedding(img_size, patch_size, in_channels, embed_dim)
        n_patches = self.patch_embed.n_patches
        
        # class token and position embedding
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, n_patches + 1, embed_dim))
        
        # dropout
        self.pos_dropout = nn.Dropout(dropout)
        
        # transformer encoder layers
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim,
            nhead=num_heads,
            dim_feedforward=embed_dim * 4,
            dropout=dropout,
            batch_first=True,
            activation='gelu'
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        # layer norm and classification head
        self.norm = nn.LayerNorm(embed_dim)
        self.head = nn.Linear(embed_dim, num_classes)
        
        # initializing weights
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
        nn.init.trunc_normal_(self.cls_token, std=0.02)
        self.apply(self._init_weights)
    
    def _init_weights(self, m):
        if isinstance(m, nn.Linear):
            nn.init.trunc_normal_(m.weight, std=0.02)
            if m.bias is not None:
                nn.init.constant_(m.bias, 0)
        elif isinstance(m, nn.LayerNorm):
            nn.init.constant_(m.bias, 0)
            nn.init.constant_(m.weight, 1.0)
    
    def forward(self, x):
        x = self.patch_embed(x)  
        batch_size = x.shape[0]
        cls_tokens = self.cls_token.expand(batch_size, -1, -1)  
        x = torch.cat([cls_tokens, x], dim=1)  
        
        x = x + self.pos_embed
        x = self.pos_dropout(x)

        x = self.transformer(x) 
        
        x = self.norm(x[:, 0])  
        x = self.head(x) 
        return x

class ModelLoader:
    def __init__(self, models_path="models"):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Using device: {self.device}")

        # initialise all attributes to None first so nothing is ever undefined
        self.ct_cnn = None
        self.ct_vit = None
        self.ct_rf = None
        self.ct_label_encoder = None
        self.ct_feature_cols = None
        self.mri_cnn = None
        self.mri_vit = None
        self.mri_rf = None
        self.mri_label_encoder = None
        self.mri_feature_cols = None

        print("\nLoading CT models...")
        
        # CT CNN
        cnn_path = "models/best_ct_cnn_model.pth"
        if os.path.exists(cnn_path):
            self.ct_cnn = TumorCNN()
            self.ct_cnn.load_state_dict(torch.load(cnn_path, map_location=self.device))
            self.ct_cnn.to(self.device)
            self.ct_cnn.eval()
            print("CT CNN has been loaded!")
        else:
            print(f"CT CNN not found at {cnn_path}.")
        
        # CT ViT
        vit_path = "models/vit_ct_model_complete.pth"
        if os.path.exists(vit_path):
            self.ct_vit = VisionTransformer()
            state_dict = torch.load(vit_path, map_location=self.device)
            if isinstance(state_dict, dict) and 'model_state_dict' in state_dict:
                self.ct_vit.load_state_dict(state_dict['model_state_dict'])
            else:
                self.ct_vit.load_state_dict(state_dict)
            self.ct_vit.to(self.device)
            self.ct_vit.eval()
            print("CT ViT has been loaded!")
        else:
            print(f"CT ViT not found at {vit_path}.")
        
        # CT Random Forest
        rf_path = "models/new_dataset_model.pkl"
        if os.path.exists(rf_path):
            self.ct_rf = joblib.load(rf_path)
            self.ct_label_encoder = joblib.load("models/new_dataset_label_encoder.pkl")
            self.ct_feature_cols = joblib.load("models/new_dataset_feature_cols.pkl")
            print("CT Random Forest has been loaded!")
        else:
            print(f"CT RF not found at {rf_path}.")

        print("\nLoading MRI models...")
        
        # MRI CNN
        mri_cnn_path = "models/best_cnn_mri_model.pth"
        if os.path.exists(mri_cnn_path):
            self.mri_cnn = TumorCNN()
            self.mri_cnn.load_state_dict(torch.load(mri_cnn_path, map_location=self.device))
            self.mri_cnn.to(self.device)
            self.mri_cnn.eval()
            print("MRI CNN has been loaded!")
        else:
            print(f"MRI CNN not found at {mri_cnn_path}.")
        
        # MRI ViT
        mri_vit_path = "models/vit_mri_model_complete.pth"
        if os.path.exists(mri_vit_path):
            self.mri_vit = VisionTransformer()
            state_dict = torch.load(mri_vit_path, map_location=self.device)
            if isinstance(state_dict, dict) and 'model_state_dict' in state_dict:
                self.mri_vit.load_state_dict(state_dict['model_state_dict'])
            else:
                self.mri_vit.load_state_dict(state_dict)
            self.mri_vit.to(self.device)
            self.mri_vit.eval()
            print("MRI ViT has been loaded!")
        else:
            print(f"MRI ViT not found at {mri_vit_path}.")

        # MRI Random Forest
        mri_rf_path = "models/mri_model.pkl"
        if os.path.exists(mri_rf_path):
            self.mri_rf = joblib.load(mri_rf_path)
            self.mri_label_encoder = joblib.load("models/mri_label_encoder.pkl")
            self.mri_feature_cols = joblib.load("models/mri_feature_cols.pkl")
            print("MRI Random Forest has been loaded!")
        else:
            print(f"MRI RF not found at {mri_rf_path}.")

        print("\nAll models loaded. Summary:")
        print(f"  CT  — CNN: {self.ct_cnn is not None} | ViT: {self.ct_vit is not None} | RF: {self.ct_rf is not None}")
        print(f"  MRI — CNN: {self.mri_cnn is not None} | ViT: {self.mri_vit is not None} | RF: {self.mri_rf is not None}")

    def predict_ct_cnn(self, image_tensor):
        """Run CT CNN inference"""
        if self.ct_cnn is None:
            return "Error", 0.0, [0.5, 0.5]
        with torch.no_grad():
            image_tensor = image_tensor.to(self.device)
            output = self.ct_cnn(image_tensor)
            probs = torch.softmax(output, dim=1).cpu().numpy()[0]
            pred_idx = int(probs.argmax())
            prediction = self.ct_label_encoder.classes_[pred_idx] if self.ct_label_encoder else ("Tumor" if pred_idx == 1 else "Healthy")
            confidence = float(probs[pred_idx])
            return prediction, confidence, probs.tolist()
    
    def predict_ct_vit(self, image_tensor):
        """Run CT ViT inference"""
        if self.ct_vit is None:
            return "Error", 0.0, [0.5, 0.5]
        with torch.no_grad():
            image_tensor = image_tensor.to(self.device)
            output = self.ct_vit(image_tensor)
            probs = torch.softmax(output, dim=1).cpu().numpy()[0]
            pred_idx = int(probs.argmax())
            prediction = self.ct_label_encoder.classes_[pred_idx] if self.ct_label_encoder else ("Tumor" if pred_idx == 1 else "Healthy")
            confidence = float(probs[pred_idx])
            return prediction, confidence, probs.tolist()
    
    def predict_ct_rf(self, features_df):
        """Run CT Random Forest inference"""
        if self.ct_rf is None:
            return "Error", 0.0, [0.5, 0.5]
        features_df = features_df[self.ct_feature_cols]
        probs = self.ct_rf.predict_proba(features_df)[0]
        pred_idx = int(probs.argmax())
        prediction = self.ct_label_encoder.classes_[pred_idx]
        confidence = float(probs[pred_idx])
        return prediction, confidence, probs.tolist()
    
    def predict_mri_cnn(self, image_tensor):
        """Run MRI CNN inference"""
        if self.mri_cnn is None:
            return "Error", 0.0, [0.5, 0.5]
        with torch.no_grad():
            image_tensor = image_tensor.to(self.device)
            output = self.mri_cnn(image_tensor)
            probs = torch.softmax(output, dim=1).cpu().numpy()[0]
            pred_idx = int(probs.argmax())
            prediction = self.mri_label_encoder.classes_[pred_idx] if self.mri_label_encoder else ("Tumor" if pred_idx == 1 else "Healthy")
            confidence = float(probs[pred_idx])
            return prediction, confidence, probs.tolist()
    
    def predict_mri_vit(self, image_tensor):
        """Run MRI ViT inference"""
        if self.mri_vit is None:
            return "Error", 0.0, [0.5, 0.5]
        with torch.no_grad():
            image_tensor = image_tensor.to(self.device)
            output = self.mri_vit(image_tensor)
            probs = torch.softmax(output, dim=1).cpu().numpy()[0]
            pred_idx = int(probs.argmax())
            prediction = self.mri_label_encoder.classes_[pred_idx] if self.mri_label_encoder else ("Tumor" if pred_idx == 1 else "Healthy")
            confidence = float(probs[pred_idx])
            return prediction, confidence, probs.tolist()
    
    def predict_mri_rf(self, features_df):
        """Run MRI Random Forest inference"""
        if self.mri_rf is None:
            return "Error", 0.0, [0.5, 0.5]
        features_df = features_df[self.mri_feature_cols]
        probs = self.mri_rf.predict_proba(features_df)[0]
        pred_idx = int(probs.argmax())
        prediction = self.mri_label_encoder.classes_[pred_idx]
        confidence = float(probs[pred_idx])
        return prediction, confidence, probs.tolist()