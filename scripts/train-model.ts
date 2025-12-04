// scripts/train-model.ts

import * as tf from '@tensorflow/tfjs'
import fs from 'fs'
import path from 'path'
import {Logger} from '@/lib/utils/logger'
import {IModelEvaluation, IModelTrainingConfig} from '@/types'

const logger = new Logger('ModelTraining')

function getConfig(): IModelTrainingConfig {
    return {
        epochs: parseInt(process.env.ML_EPOCHS || '100'),
        batchSize: parseInt(process.env.ML_BATCH_SIZE || '32'),
        learningRate: parseFloat(process.env.ML_LEARNING_RATE || '0.001'),
        validationSplit: parseFloat(process.env.ML_VALIDATION_SPLIT || '0.2'),
        trainingSamples: parseInt(process.env.ML_TRAIN_SAMPLES || '10000'),
        testSamples: parseInt(process.env.ML_TEST_SAMPLES || '1000'),
    }
}

async function generateSyntheticData(samples: number): Promise<{ features: tf.Tensor2D; labels: tf.Tensor2D }> {
    logger.info('Generating synthetic data', {samples})
    const features: number[][] = []
    const labels: number[][] = []

    for (let i = 0; i < samples; i++) {
        const feature: number[] = [
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(),
        ]
        features.push(feature)
        const matchQuality = (feature[0] + feature[2] + feature[3]) / 3
        labels.push([matchQuality > 0.6 ? 1 : 0])
    }

    return {
        features: tf.tensor2d(features),
        labels: tf.tensor2d(labels),
    }
}

function buildModel(config: IModelTrainingConfig): tf.LayersModel {
    logger.info('Building neural network model')
    const model = tf.sequential({
        layers: [
            tf.layers.dense({
                inputShape: [10],
                units: 64,
                activation: 'relu',
                kernelRegularizer: tf.regularizers.l2({l2: 0.001})
            }),
            tf.layers.batchNormalization(),
            tf.layers.dropout({rate: 0.3}),
            tf.layers.dense({units: 32, activation: 'relu', kernelRegularizer: tf.regularizers.l2({l2: 0.001})}),
            tf.layers.dropout({rate: 0.2}),
            tf.layers.dense({units: 16, activation: 'relu'}),
            tf.layers.dense({units: 1, activation: 'sigmoid'}),
        ],
    })

    model.compile({
        optimizer: tf.train.adam(config.learningRate),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy', tf.metrics.precision, tf.metrics.recall],
    })
    return model
}

async function evaluateModel(model: tf.LayersModel, testFeatures: tf.Tensor2D, testLabels: tf.Tensor2D): Promise<IModelEvaluation> {
    logger.info('Evaluating model on test data...')
    const metrics = model.evaluate(testFeatures, testLabels) as tf.Tensor[]
    const [loss, accuracy, precision, recall] = await Promise.all([
        metrics[0].data(), metrics[1].data(), metrics[2].data(), metrics[3].data()
    ])

    const p = precision[0]
    const r = recall[0]
    const f1Score = (p + r === 0) ? 0 : 2 * (p * r) / (p + r)

    const predictions = model.predict(testFeatures) as tf.Tensor
    const roundedPredictions = predictions.round()
    const confusionMatrixTensor = tf.math.confusionMatrix(testLabels.flatten(), roundedPredictions.flatten(), 2)
    const confusionMatrix = (await confusionMatrixTensor.array()) as number[][]

    metrics.forEach((m) => m.dispose())
    predictions.dispose()
    roundedPredictions.dispose()
    confusionMatrixTensor.dispose()

    return {
        loss: loss[0],
        accuracy: accuracy[0],
        precision: p,
        recall: r,
        f1Score: f1Score,
        confusionMatrix: confusionMatrix,
    }
}

async function runTrainingPipeline(): Promise<void> {
    let trainingData: { features: tf.Tensor2D; labels: tf.Tensor2D } | null = null
    let testData: { features: tf.Tensor2D; labels: tf.Tensor2D } | null = null

    try {
        const config = getConfig()
        logger.info('Starting model training pipeline', config)

        trainingData = await generateSyntheticData(config.trainingSamples)
        testData = await generateSyntheticData(config.testSamples)

        const model = buildModel(config)

        await model.fit(trainingData.features, trainingData.labels, {
            epochs: config.epochs,
            batchSize: config.batchSize,
            validationSplit: config.validationSplit,
            shuffle: true,
            verbose: 1,
        })

        const evaluation = await evaluateModel(model, testData.features, testData.labels)

        // --- Custom Save Handler for Node.js (bypassing tfjs-node) ---
        const modelDir = path.join(process.cwd(), 'ml-models', 'trained')
        if (!fs.existsSync(modelDir)) {
            fs.mkdirSync(modelDir, {recursive: true})
        }

        await model.save(tf.io.withSaveHandler(async (artifacts) => {
            if (artifacts.modelTopology) {
                fs.writeFileSync(
                    path.join(modelDir, 'model.json'),
                    JSON.stringify({
                        modelTopology: artifacts.modelTopology,
                        format: artifacts.format,
                        generatedBy: artifacts.generatedBy,
                        convertedBy: artifacts.convertedBy,
                        weightsManifest: [{
                            paths: ['./weights.bin'],
                            weights: artifacts.weightSpecs
                        }]
                    }, null, 2)
                )
            }

            if (artifacts.weightData) {
                // Fix TS Error: Cast to ArrayBuffer (since we know it's not a shard array in this context)
                const weightBuffer = Buffer.from(artifacts.weightData as ArrayBuffer)
                fs.writeFileSync(path.join(modelDir, 'weights.bin'), weightBuffer)
            }

            return {
                modelArtifactsInfo: {
                    dateSaved: new Date(),
                    modelTopologyType: 'JSON',
                    // Fix TS Error: safely access byteLength
                    weightDataBytes: (artifacts.weightData as ArrayBuffer)?.byteLength || 0,
                }
            }
        }))

        // Save metadata
        fs.writeFileSync(path.join(modelDir, 'model-summary.json'), JSON.stringify({
            trainingDate: new Date(),
            config: config,
            evaluationResults: evaluation
        }, null, 2))

        logger.info('Model training complete. Files saved to:', {path: modelDir})

    } catch (error) {
        logger.error('Training pipeline failed', error as Error)
        throw error
    } finally {
        trainingData?.features.dispose()
        trainingData?.labels.dispose()
        testData?.features.dispose()
        testData?.labels.dispose()
        tf.disposeVariables()
    }
}

runTrainingPipeline().catch((error) => {
    logger.critical('Unhandled training error', error)
    process.exit(1)
})