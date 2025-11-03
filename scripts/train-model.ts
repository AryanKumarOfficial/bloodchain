import * as tf from '@tensorflow/tfjs'
import fs from 'fs'
import path from 'path'
import {Logger} from '@/lib/utils/logger'
import {IModelEvaluation, IModelTrainingConfig,} from '@/types'

const logger = new Logger('ModelTraining')

/**
 * Load configuration from environment variables with defaults.
 */
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

/**
 * Generate synthetic data for training or testing.
 */
async function generateSyntheticData(
    samples: number
): Promise<{
    features: tf.Tensor2D
    labels: tf.Tensor2D
}> {
    logger.info('Generating synthetic data', {samples})

    const features: number[][] = []
    const labels: number[][] = []

    for (let i = 0; i < samples; i++) {
        const feature: number[] = [
            Math.random(), // Blood type compatibility
            Math.random(), // Rh factor compatibility
            Math.random(), // Donor reputation score
            Math.random(), // Donor availability
            Math.random(), // Success rate
            Math.random(), // Response time (normalized)
            Math.random(), // Days since last donation
            Math.random(), // Urgency level
            Math.random(), // Fraud risk inverse
            Math.random(), // Biometric verification
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

/**
 * Build neural network model.
 */
function buildModel(config: IModelTrainingConfig): tf.LayersModel {
    logger.info('Building neural network model')
    const model = tf.sequential({
        layers: [
            tf.layers.dense({
                inputShape: [10],
                units: 64,
                activation: 'relu',
                kernelRegularizer: tf.regularizers.l2({l2: 0.001}),
                name: 'input_layer',
            }),
            tf.layers.batchNormalization({name: 'batch_norm_1'}),
            tf.layers.dropout({rate: 0.3, name: 'dropout_1'}),
            tf.layers.dense({
                units: 32,
                activation: 'relu',
                kernelRegularizer: tf.regularizers.l2({l2: 0.001}),
                name: 'hidden_1',
            }),
            tf.layers.dropout({rate: 0.2, name: 'dropout_2'}),
            tf.layers.dense({
                units: 16,
                activation: 'relu',
                name: 'hidden_2',
            }),
            tf.layers.dense({
                units: 1,
                activation: 'sigmoid',
                name: 'output',
            }),
        ],
    })

    model.compile({
        optimizer: tf.train.adam(config.learningRate),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy', tf.metrics.precision, tf.metrics.recall],
    })
    logger.info('Model built successfully')
    return model
}

/**
 * UPDATED: Evaluate the model on unseen test data.
 */
async function evaluateModel(
    model: tf.LayersModel,
    testFeatures: tf.Tensor2D,
    testLabels: tf.Tensor2D
): Promise<IModelEvaluation> {
    logger.info('Evaluating model on test data...')

    // 1. Get standard metrics (Loss, Accuracy, Precision, Recall)
    const metrics = model.evaluate(testFeatures, testLabels) as tf.Tensor[]
    const [lossT, accT, precT, recallT] = metrics

    const [loss, accuracy, precision, recall] = await Promise.all([
        lossT.data(),
        accT.data(),
        precT.data(),
        recallT.data(),
    ])

    // 2. Calculate F1 Score
    const p = precision[0]
    const r = recall[0]
    const f1Score = (p + r === 0) ? 0 : 2 * (p * r) / (p + r)

    // 3. Get predictions to build confusion matrix
    const predictions = model.predict(testFeatures) as tf.Tensor
    const roundedPredictions = predictions.round() // Convert probabilities to 0 or 1

    // 4. Calculate Confusion Matrix
    // **FIX:** Replaced `.reshape([-1])` with `.flatten()`
    const confusionMatrixTensor = tf.math.confusionMatrix(
        testLabels.flatten(), // Flatten labels to Tensor1D
        roundedPredictions.flatten(), // Flatten predictions to Tensor1D
        2 // Number of classes (0 and 1)
    )
    const confusionMatrix = (await confusionMatrixTensor.array()) as number[][]

    // 5. Dispose all temporary tensors
    metrics.forEach((m) => m.dispose())
    predictions.dispose()
    roundedPredictions.dispose()
    confusionMatrixTensor.dispose()

    const evaluation: IModelEvaluation = {
        loss: loss[0],
        accuracy: accuracy[0],
        precision: p,
        recall: r,
        f1Score: f1Score,
        confusionMatrix: confusionMatrix,
    }

    logger.info('Model evaluation complete', {
        loss: evaluation.loss.toFixed(4),
        accuracy: evaluation.accuracy.toFixed(4),
        precision: evaluation.precision.toFixed(4),
        recall: evaluation.recall.toFixed(4),
        f1Score: evaluation.f1Score.toFixed(4),
    })
    logger.info('Confusion Matrix:', evaluation.confusionMatrix)

    return evaluation
}

/**
 * Main training and evaluation pipeline.
 */
async function runTrainingPipeline(): Promise<void> {
    let trainingData: { features: tf.Tensor2D; labels: tf.Tensor2D } | null = null
    let testData: { features: tf.Tensor2D; labels: tf.Tensor2D } | null = null

    try {
        const config = getConfig()
        logger.info('Starting model training pipeline', config)

        // 1. Generate data
        trainingData = await generateSyntheticData(config.trainingSamples)
        testData = await generateSyntheticData(config.testSamples)

        // 2. Build model
        const model = buildModel(config)

        // 3. Train model
        logger.info('Training in progress...')
        const history = await model.fit(trainingData.features, trainingData.labels, {
            epochs: config.epochs,
            batchSize: config.batchSize,
            validationSplit: config.validationSplit,
            shuffle: true,
            verbose: 1,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    if ((epoch + 1) % 10 === 0 && logs) {
                        logger.info(`Epoch ${epoch + 1} completed`, {
                            loss: logs.loss?.toFixed(4),
                            accuracy: logs.acc?.toFixed(4),
                            val_loss: logs.val_loss?.toFixed(4),
                        })
                    }
                },
            },
        })
        logger.info('Training completed')

        // 4. Evaluate model (using the new function)
        const evaluation = await evaluateModel(
            model,
            testData.features,
            testData.labels
        )

        // 5. Save artifacts
        const modelDir = path.join(process.cwd(), 'ml-models', 'trained')
        if (!fs.existsSync(modelDir)) {
            fs.mkdirSync(modelDir, {recursive: true})
        }

        // Save model
        const modelPath = `file://${modelDir}`
        await model.save(modelPath)
        logger.info('Model saved', {path: modelDir})

        // Save training history
        const historyPath = path.join(modelDir, 'training-history.json')
        // Using 'any' as history.history can contain Tensors
        const historyData: { [metric: string]: any[] } = history.history
        fs.writeFileSync(historyPath, JSON.stringify(historyData, null, 2))
        logger.info('Training history saved', {path: historyPath})

        // Save model summary with config and evaluation results
        const summaryPath = path.join(modelDir, 'model-summary.json')
        const summary = {
            trainingDate: new Date(),
            config: config,
            evaluationResults: evaluation,
            totalParameters: model.countParams(),
        }
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
        logger.info('Model summary saved', {path: summaryPath})

        logger.info('Model training complete and ready for deployment!')
    } catch (error) {
        logger.error('Training pipeline failed', error as Error)
        throw error
    } finally {
        // 6. Cleanup Tensors
        trainingData?.features.dispose()
        trainingData?.labels.dispose()
        testData?.features.dispose()
        testData?.labels.dispose()
        tf.disposeVariables()
        logger.info('Cleaned up tensors')
    }
}

// Run training
runTrainingPipeline().catch((error) => {
    logger.critical('Unhandled training error', error)
    process.exit(1)
})

