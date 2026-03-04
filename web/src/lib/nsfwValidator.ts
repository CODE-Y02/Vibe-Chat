import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';
import { logger } from './logger';

// Need to lazy load this so it doesn't block the main chunk
let model: nsfwjs.NSFWJS | null = null;
let isLoading = false;

const CACHE_PATH = 'indexeddb://vibe-nsfw-v1';

let modelInitPromise: Promise<void> | null = null;

export const loadNSFWModel = async () => {
    if (model) return;
    if (modelInitPromise) return modelInitPromise;
    
    isLoading = true;
    modelInitPromise = (async () => {
        try {
            await tf.ready();
            logger.info("Downloading/Loading NSFWJS model (browser will cache this network request)...");
            // MobileNetV2 is fast and lightweight for client-side
            model = await nsfwjs.load('MobileNetV2Mid', { size: 224 });
            logger.info("NSFWJS: Successfully loaded and initialized.");
        } catch (err) {
            logger.error("Failed to manage NSFWJS model:", err);
        } finally {
            isLoading = false;
        }
    })();
    
    return modelInitPromise;
};

export const classifyImage = async (videoElement: HTMLVideoElement) => {
    if (!model) return null;
    try {
        const predictions = await model.classify(videoElement, 3);
        return predictions;
    } catch (err) {
        logger.error("Inference error:", err);
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
