import numpy as np
import pandas as pd
from skimage.feature import graycomatrix, graycoprops
from skimage.measure import regionprops, label

def extract_features(img_arr):
    img_float = img_arr.astype(np.float32)
    img_norm = img_float - img_float.min()
    if img_norm.max()>0:
        img_norm = (img_norm/img_norm.max()*255).astype(np.uint8)
    else:
        img_norm = img_norm.astype(np.uint8)

    # intensity features
    features = {}
    pixel_flat = img_float.flatten()
    features['mean_intensity'] = float(np.mean(pixel_flat))
    features['std_intensity'] = float(np.std(pixel_flat))
    features['min_intensity'] = float(np.min(pixel_flat))
    features['max_intensity'] = float(np.max(pixel_flat))
    features['range_intensity'] = float(np.max(pixel_flat) - np.min(pixel_flat))
    features['skewness'] = float(pd.Series(pixel_flat).skew())
    features['kurtosis'] = float(pd.Series(pixel_flat).kurtosis())
    features['percentile_10'] = float(np.percentile(pixel_flat, 10))
    features['percentile_25'] = float(np.percentile(pixel_flat, 25))
    features['percentile_50'] = float(np.percentile(pixel_flat, 50))
    features['percentile_75'] = float(np.percentile(pixel_flat, 75))
    features['percentile_90'] = float(np.percentile(pixel_flat, 90))
    features['texture_contrast'] = float(np.percentile(pixel_flat, 75) - np.percentile(pixel_flat, 25))
    features['variance'] = float(np.var(pixel_flat))
    features['energy'] = float(np.sum(pixel_flat ** 2) / pixel_flat.size)
    features['total_energy'] = float(np.sum(pixel_flat ** 2))

    hist, _ = np.histogram(pixel_flat, bins=50, density=True)
    hist = hist[hist > 0]
    features['entropy'] = float(-np.sum(hist*np.log2(hist+1e-10))) if len(hist) > 0 else 0

    # texture features
    glcm = graycomatrix(img_norm, distances=[1], angles=[0, np.pi/4, np.pi/2, 3*np.pi/4],
                            levels=256, symmetric=True, normed=True)
    features['glcm_contrast'] = float(graycoprops(glcm, 'contrast').mean())
    features['glcm_dissimilarity'] = float(graycoprops(glcm, 'dissimilarity').mean())
    features['glcm_homogeneity'] = float(graycoprops(glcm, 'homogeneity').mean())
    features['glcm_energy'] = float(graycoprops(glcm, 'energy').mean())
    features['glcm_correlation'] = float(graycoprops(glcm, 'correlation').mean())
    features['glcm_ASM'] = float(graycoprops(glcm, 'ASM').mean())

    # shape features
    binary = img_norm > np.percentile(img_norm, 85)
    labeled = label(binary)
    if labeled.max() > 0:
        props = regionprops(labeled)
        largest = max(props, key=lambda x: x.area)
        features['area'] = float(largest.area)
        features['perimeter'] = float(largest.perimeter)
        features['eccentricity'] = float(largest.eccentricity)
        features['solidity'] = float(largest.solidity)
        features['extent'] = float(largest.extent)
        features['roundness'] = 4 * np.pi * features['area'] / (features['perimeter'] ** 2) if features['perimeter'] > 0 else 0
        features['aspect_ratio'] = largest.major_axis_length / largest.minor_axis_length if largest.minor_axis_length > 0 else 1
    else:
        features['area'] = features['perimeter'] = features['eccentricity'] = features['solidity'] = 0.0
        features['extent'] = features['roundness'] = features['aspect_ratio'] = 0.0
    
    return features