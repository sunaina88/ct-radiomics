import cv2
import numpy as np

def preprocess(image_bytes, target_size=64):
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("Could not read the image from bytes")
    img = cv2.resize(img, (target_size, target_size))
    img_float = img.astype(np.float32)

    # CT normalization — simple /255
    img_norm_ct = img_float / 255.0

    # MRI normalization — z-score then clip
    img_norm_mri = (img_float - np.mean(img_float)) / (np.std(img_float) + 1e-5)
    img_norm_mri = np.clip(img_norm_mri, -3, 3) / 3.0

    return img, img_norm_ct, img_norm_mri