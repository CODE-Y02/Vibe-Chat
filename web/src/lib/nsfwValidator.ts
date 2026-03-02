import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';

// Need to lazy load this so it doesn't block the main chunk
let model: nsfwjs.NSFWJS | null = null;
let isLoading = false;

export const loadNSFWModel = async () => {
    if (model || isLoading) return;
    isLoading = true;
    try {
        console.log("Loading NSFWJS model...");
        // tfjs uses indexedDB to cache under the hood by default when fetching
        model = await nsfwjs.load(); // Uses default MobileNetV2 architecture
        console.log("NSFWJS model loaded successfully!");
    } catch (err) {
        console.error("Failed to load NSFWJS model:", err);
    } finally {
        isLoading = false;
    }
};

export const classifyImage = async (videoElement: HTMLVideoElement) => {
    if (!model) return null;
    try {
        const predictions = await model.classify(videoElement, 3);
        return predictions;
    } catch (err) {
        console.error("Inference error:", err);
        return null;
    }
};

export const isNSFW = (predictions: nsfwjs.PredictionType[] | null): boolean => {
    if (!predictions) return false;

    // We check if either Porn or Hentai are the top predictions with high probability
    const dangerousCategories = ['Porn', 'Hentai'];

    for (const p of predictions) {
        if (dangerousCategories.includes(p.className) && p.probability > 0.8) {
            return true;
        }
    }
    return false;
};
