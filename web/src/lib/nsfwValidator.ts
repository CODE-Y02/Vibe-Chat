import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';
import { logger } from './logger';

// Need to lazy load this so it doesn't block the main chunk
let model: nsfwjs.NSFWJS | null = null;
let isLoading = false;

const CACHE_PATH = 'indexeddb://vibe-nsfw-v1';

export const loadNSFWModel = async () => {
    if (model || isLoading) return;
    isLoading = true;

    try {
        await tf.ready();
        logger.info("Checking NSFWJS model cache...");

        try {
            // Attempt to load the model architecture and weights from local IndexedDB
            const loadedTFModel = await tf.loadLayersModel(CACHE_PATH);
            // Construct the nsfwjs wrapper using the cached model
            // @ts-ignore - constructors might vary in types but exist in runtime
            model = new nsfwjs.NSFWJS(loadedTFModel, { size: 224 });
            logger.info("NSFWJS: Successfully loaded from IndexedDB cache.");
        } catch (e) {
            logger.info("NSFWJS: Cache miss, downloading default model...");
            // Specify default model source explicitly to avoid console usage warnings
            // 'https://nsfwjs.com/model/' is the default endpoint for MobileNetV2
            model = await (nsfwjs as any).load('https://nsfwjs.com/model/', { size: 224 });

            // Persist the underlying TF model to IndexedDB for future instant loads
            if (model && (model as any).model) {
                await (model as any).model.save(CACHE_PATH);
                logger.info("NSFWJS: Model downloaded and persisted to IndexedDB.");
            }
        }
    } catch (err) {
        logger.error("Failed to manage NSFWJS model:", err);
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
