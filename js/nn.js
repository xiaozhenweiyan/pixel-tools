/**
 * nn.js
 * 神经网络预测模块 (Neural Network Prediction Module)
 *
 * 纯 JavaScript 实现的前馈神经网络 (MLP)，用于时间序列预测。
 * 包含：前向传播、反向传播训练、像素风网络可视化动画。
 *
 * 通过 <script> 标签加载，导出全局对象 `neuralNet`：
 *   {
 *     predict(series, steps) → number[]      // 预测 steps 步
 *     train(series, epochs, onEpoch) → number // 训练，返回最终 loss
 *     drawNetwork(canvas, state)              // 绘制网络结构图
 *     animateTraining(canvas, series)         // 训练动画（返回 Promise）
 *     getPrediction() → number|null           // 获取最新预测值
 *     reset()                                  // 重置网络
 *   }
 *
 * 网络结构：输入层(3) → 隐藏层(8, ReLU) → 输出层(1, Linear)
 * 输入：序列最后 3 个值；输出：下一个值
 *
 * 视觉风格与 chart.js 一致：#1a1a2e 背景、白色 3px 边框、金色强调。
 */

const neuralNet = (function () {
  'use strict';

  // ============================================================
  // 网络配置 / Network Config
  // ============================================================
  const INPUT_SIZE = 3;
  const HIDDEN_SIZE = 8;
  const OUTPUT_SIZE = 1;
  const LEARNING_RATE = 0.01;
  const DEFAULT_EPOCHS = 500;

  // ============================================================
  // 网络参数 / Network Parameters
  // ============================================================
  let params = {
    W1: [],  // INPUT_SIZE × HIDDEN_SIZE
    b1: [],  // HIDDEN_SIZE
    W2: [],  // HIDDEN_SIZE × OUTPUT_SIZE
    b2: []   // OUTPUT_SIZE
  };

  let lastPrediction = null;
  let trainingLossHistory = [];

  // ============================================================
  // 激活函数 / Activation Functions
  // ============================================================
  function relu(x) { return x > 0 ? x : 0; }
  function reluDeriv(x) { return x > 0 ? 1 : 0; }

  // ============================================================
  // 初始化 / Initialization
  // ============================================================
  function initWeights() {
    // He 初始化 (for ReLU) / He initialization for ReLU
    var scale1 = Math.sqrt(2 / INPUT_SIZE);
    params.W1 = [];
    for (var i = 0; i < INPUT_SIZE; i++) {
      var row = [];
      for (var j = 0; j < HIDDEN_SIZE; j++) {
        row.push((Math.random() * 2 - 1) * scale1);
      }
      params.W1.push(row);
    }
    params.b1 = new Array(HIDDEN_SIZE).fill(0);

    var scale2 = Math.sqrt(2 / HIDDEN_SIZE);
    params.W2 = [];
    for (var k = 0; k < HIDDEN_SIZE; k++) {
      var row2 = [];
      for (var m = 0; m < OUTPUT_SIZE; m++) {
        row2.push((Math.random() * 2 - 1) * scale2);
      }
      params.W2.push(row2);
    }
    params.b2 = new Array(OUTPUT_SIZE).fill(0);
  }

  // ============================================================
  // 前向传播 / Forward Pass
  // ============================================================
  function forward(input) {
    // 输入 → 隐藏层 / input → hidden
    var z1 = new Array(HIDDEN_SIZE);
    var a1 = new Array(HIDDEN_SIZE);
    for (var j = 0; j < HIDDEN_SIZE; j++) {
      var sum = params.b1[j];
      for (var i = 0; i < INPUT_SIZE; i++) {
        sum += input[i] * params.W1[i][j];
      }
      z1[j] = sum;
      a1[j] = relu(sum);
    }

    // 隐藏层 → 输出 / hidden → output
    var z2 = new Array(OUTPUT_SIZE);
    var a2 = new Array(OUTPUT_SIZE);
    for (var k = 0; k < OUTPUT_SIZE; k++) {
      var sum2 = params.b2[k];
      for (var j2 = 0; j2 < HIDDEN_SIZE; j2++) {
        sum2 += a1[j2] * params.W2[j2][k];
      }
      z2[k] = sum2;
      a2[k] = sum2; // Linear activation for output
    }

    return { z1: z1, a1: a1, z2: z2, a2: a2 };
  }

  // ============================================================
  // 数据归一化 / Data Normalization
  // ============================================================
  function normalizeSeries(series) {
    var n = series.length;
    if (n === 0) return { data: [], mean: 0, std: 1 };
    var sum = 0;
    for (var i = 0; i < n; i++) sum += series[i];
    var mean = sum / n;
    var sumSq = 0;
    for (var j = 0; j < n; j++) sumSq += (series[j] - mean) * (series[j] - mean);
    var std = Math.sqrt(sumSq / n);
    if (std < 1e-10) std = 1;
    var normalized = [];
    for (var k = 0; k < n; k++) normalized.push((series[k] - mean) / std);
    return { data: normalized, mean: mean, std: std };
  }

  function denormalize(val, mean, std) {
    return val * std + mean;
  }

  // ============================================================
  // 生成训练样本 / Generate Training Samples
  // ============================================================
  function generateSamples(normalizedSeries) {
    var samples = [];
    var n = normalizedSeries.length;
    for (var i = INPUT_SIZE; i < n; i++) {
      var input = [];
      for (var j = 0; j < INPUT_SIZE; j++) {
        input.push(normalizedSeries[i - INPUT_SIZE + j]);
      }
      var target = [normalizedSeries[i]];
      samples.push({ input: input, target: target });
    }
    return samples;
  }

  // ============================================================
  // 训练单个 epoch / Train One Epoch
  // ============================================================
  function trainEpoch(samples, lr) {
    var totalLoss = 0;

    for (var s = 0; s < samples.length; s++) {
      var sample = samples[s];
      var input = sample.input;
      var target = sample.target;

      // 前向 / forward
      var out = forward(input);

      // 计算损失 (MSE) / loss calculation
      var loss = 0;
      for (var k = 0; k < OUTPUT_SIZE; k++) {
        var diff = out.a2[k] - target[k];
        loss += diff * diff;
      }
      totalLoss += loss / OUTPUT_SIZE;

      // 反向传播 / backprop
      // 输出层 delta (linear activation, MSE loss)
      var dZ2 = new Array(OUTPUT_SIZE);
      for (var k2 = 0; k2 < OUTPUT_SIZE; k2++) {
        dZ2[k2] = out.a2[k2] - target[k2];
      }

      // 隐藏层 → 输出层 梯度
      var dW2 = [];
      var db2 = new Array(OUTPUT_SIZE).fill(0);
      for (var j3 = 0; j3 < HIDDEN_SIZE; j3++) {
        var row = [];
        for (var k3 = 0; k3 < OUTPUT_SIZE; k3++) {
          var grad = out.a1[j3] * dZ2[k3];
          row.push(grad);
          db2[k3] += 0; // bias grad is just dZ2, added below
        }
        dW2.push(row);
      }
      for (var k4 = 0; k4 < OUTPUT_SIZE; k4++) {
        db2[k4] = dZ2[k4];
      }

      // 隐藏层 delta
      var dZ1 = new Array(HIDDEN_SIZE).fill(0);
      for (var j4 = 0; j4 < HIDDEN_SIZE; j4++) {
        var sum = 0;
        for (var k5 = 0; k5 < OUTPUT_SIZE; k5++) {
          sum += params.W2[j4][k5] * dZ2[k5];
        }
        dZ1[j4] = sum * reluDeriv(out.z1[j4]);
      }

      // 输入层 → 隐藏层 梯度
      var dW1 = [];
      var db1 = new Array(HIDDEN_SIZE).fill(0);
      for (var i2 = 0; i2 < INPUT_SIZE; i2++) {
        var row2 = [];
        for (var j5 = 0; j5 < HIDDEN_SIZE; j5++) {
          row2.push(input[i2] * dZ1[j5]);
        }
        dW1.push(row2);
      }
      for (var j6 = 0; j6 < HIDDEN_SIZE; j6++) {
        db1[j6] = dZ1[j6];
      }

      // 更新参数 / update parameters
      for (var i3 = 0; i3 < INPUT_SIZE; i3++) {
        for (var j7 = 0; j7 < HIDDEN_SIZE; j7++) {
          params.W1[i3][j7] -= lr * dW1[i3][j7] / samples.length;
        }
      }
      for (var j8 = 0; j8 < HIDDEN_SIZE; j8++) {
        params.b1[j8] -= lr * db1[j8] / samples.length;
      }
      for (var j9 = 0; j9 < HIDDEN_SIZE; j9++) {
        for (var k6 = 0; k6 < OUTPUT_SIZE; k6++) {
          params.W2[j9][k6] -= lr * dW2[j9][k6] / samples.length;
        }
      }
      for (var k7 = 0; k7 < OUTPUT_SIZE; k7++) {
        params.b2[k7] -= lr * db2[k7] / samples.length;
      }
    }

    return totalLoss / samples.length;
  }

  // ============================================================
  // 预测 / Prediction
  // ============================================================
  function predict(series, steps) {
    if (!series || series.length < INPUT_SIZE) return [];
    steps = steps || 1;

    var norm = normalizeSeries(series);
    var normalized = norm.data.slice();
    var predictions = [];

    for (var s = 0; s < steps; s++) {
      var input = [];
      var n = normalized.length;
      for (var i = 0; i < INPUT_SIZE; i++) {
        input.push(normalized[n - INPUT_SIZE + i]);
      }
      var out = forward(input);
      var predNorm = out.a2[0];
      var predDenorm = denormalize(predNorm, norm.mean, norm.std);
      predictions.push(predDenorm);
      normalized.push(predNorm);
    }

    lastPrediction = predictions[0];
    return predictions;
  }

  // ============================================================
  // 训练 / Training
  // ============================================================
  function train(series, epochs, onEpoch) {
    if (!series || series.length < INPUT_SIZE + 1) return Infinity;
    epochs = epochs || DEFAULT_EPOCHS;

    initWeights();
    trainingLossHistory = [];

    var norm = normalizeSeries(series);
    var samples = generateSamples(norm.data);
    if (samples.length === 0) return Infinity;

    var finalLoss = Infinity;
    var lr = LEARNING_RATE;

    for (var e = 0; e < epochs; e++) {
      var loss = trainEpoch(samples, lr);
      trainingLossHistory.push(loss);
      finalLoss = loss;

      // 学习率衰减 / learning rate decay
      if (e > 0 && e % 100 === 0) lr *= 0.95;

      if (onEpoch && typeof onEpoch === 'function') {
        if (e % Math.max(1, Math.floor(epochs / 50)) === 0 || e === epochs - 1) {
          onEpoch(e + 1, epochs, loss);
        }
      }
    }

    return finalLoss;
  }

  // ============================================================
  // 网络可视化 / Network Visualization
  // ============================================================

  // 动画状态 / animation state
  let animState = {
    animating: false,
    rafId: null,
    activationPulse: 0,
    currentEpoch: 0,
    totalEpochs: 0,
    currentLoss: 0,
    nodeActivations: { input: [], hidden: [], output: [] }
  };

  function setupCanvasNN(canvas) {
    if (!canvas) return null;
    var dpr = window.devicePixelRatio || 1;
    var dispW = canvas.clientWidth || 400;
    var dispH = canvas.clientHeight || 280;
    canvas.width = Math.round(dispW * dpr);
    canvas.height = Math.round(dispH * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function drawNetwork(canvas, options) {
    if (!canvas) return;
    options = options || {};
    var ctx = setupCanvasNN(canvas);
    if (!ctx) return;

    var w = canvas.clientWidth || 400;
    var h = canvas.clientHeight || 280;

    // 背景 / background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // 布局参数 / layout params
    var padX = 40;
    var padY = 30;
    var plotW = w - padX * 2;
    var plotH = h - padY * 2;

    var inputY = [];
    for (var i = 0; i < INPUT_SIZE; i++) {
      inputY.push(padY + (plotH / (INPUT_SIZE + 1)) * (i + 1));
    }
    var hiddenY = [];
    for (var j = 0; j < HIDDEN_SIZE; j++) {
      hiddenY.push(padY + (plotH / (HIDDEN_SIZE + 1)) * (j + 1));
    }
    var outputY = [padY + plotH / 2];

    var xInput = padX + 10;
    var xHidden = padX + plotW / 2;
    var xOutput = w - padX - 10;

    var nodeR = 8;

    // 激活强度 / activation intensities (for visual pulse)
    var pulse = options.pulse || 0;
    var inputAct = options.inputActivations || new Array(INPUT_SIZE).fill(0.5);
    var hiddenAct = options.hiddenActivations || new Array(HIDDEN_SIZE).fill(0.5);
    var outputAct = options.outputActivations || new Array(OUTPUT_SIZE).fill(0.5);

    // 连接线 / connections (input → hidden)
    for (var i2 = 0; i2 < INPUT_SIZE; i2++) {
      for (var j2 = 0; j2 < HIDDEN_SIZE; j2++) {
        var weightVal = params.W1[i2][j2] || 0;
        var intensity = Math.min(1, Math.abs(weightVal) * 2) * (0.3 + pulse * 0.4);
        var color = weightVal >= 0
          ? 'rgba(255, 215, 0, ' + intensity + ')'
          : 'rgba(30, 144, 255, ' + intensity + ')';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1 + Math.abs(weightVal) * 2;
        ctx.beginPath();
        ctx.moveTo(xInput + nodeR, inputY[i2]);
        ctx.lineTo(xHidden - nodeR, hiddenY[j2]);
        ctx.stroke();
      }
    }

    // 连接线 / connections (hidden → output)
    for (var j3 = 0; j3 < HIDDEN_SIZE; j3++) {
      for (var k = 0; k < OUTPUT_SIZE; k++) {
        var weightVal2 = params.W2[j3][k] || 0;
        var intensity2 = Math.min(1, Math.abs(weightVal2) * 2) * (0.3 + pulse * 0.4);
        var color2 = weightVal2 >= 0
          ? 'rgba(255, 215, 0, ' + intensity2 + ')'
          : 'rgba(30, 144, 255, ' + intensity2 + ')';
        ctx.strokeStyle = color2;
        ctx.lineWidth = 1 + Math.abs(weightVal2) * 2;
        ctx.beginPath();
        ctx.moveTo(xHidden + nodeR, hiddenY[j3]);
        ctx.lineTo(xOutput - nodeR, outputY[k]);
        ctx.stroke();
      }
    }

    // 节点绘制函数 / node drawing function
    function drawNode(x, y, activation, label) {
      var radius = nodeR + activation * 2;
      // 光晕 / glow
      if (activation > 0.3) {
        var glowRadius = radius + 4 + activation * 6;
        var grad = ctx.createRadialGradient(x, y, radius, x, y, glowRadius);
        grad.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      // 外边框 / outer border
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
      ctx.fill();
      // 主体 / body
      var bodyColor = activation > 0.5
        ? 'rgba(255, 215, 0, ' + (0.6 + activation * 0.4) + ')'
        : '#2d2d44';
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      // 标签 / label
      if (label) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
      }
    }

    // 输入节点 / input nodes
    for (var i3 = 0; i3 < INPUT_SIZE; i3++) {
      drawNode(xInput, inputY[i3], inputAct[i3], 'x' + (i3 + 1));
    }
    // 隐藏节点 / hidden nodes
    for (var j4 = 0; j4 < HIDDEN_SIZE; j4++) {
      drawNode(xHidden, hiddenY[j4], hiddenAct[j4], '');
    }
    // 输出节点 / output nodes
    for (var k2 = 0; k2 < OUTPUT_SIZE; k2++) {
      drawNode(xOutput, outputY[k2], outputAct[k2], 'ŷ');
    }

    // 层标签 / layer labels
    ctx.fillStyle = '#aaaaaa';
    ctx.font = 'bold 11px "Courier New", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('输入层', xInput, padY - 4);
    ctx.fillText('隐藏层', xHidden, padY - 4);
    ctx.fillText('输出层', xOutput, padY - 4);

    // 训练信息 / training info
    if (options.epoch !== undefined && options.totalEpochs !== undefined) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 11px "Courier New", Courier, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Epoch: ' + options.epoch + '/' + options.totalEpochs, padX, h - padY + 4);
      if (options.loss !== undefined) {
        ctx.fillText('Loss: ' + options.loss.toFixed(6), w - padX - 100, h - padY + 4);
      }
    }
  }

  // ============================================================
  // 训练动画 / Training Animation
  // ============================================================
  function animateTraining(canvas, series) {
    return new Promise(function (resolve) {
      if (!series || series.length < INPUT_SIZE + 1) {
        resolve();
        return;
      }

      initWeights();
      trainingLossHistory = [];

      var norm = normalizeSeries(series);
      var samples = generateSamples(norm.data);
      if (samples.length === 0) {
        resolve();
        return;
      }

      var totalEpochs = 300;
      var lr = LEARNING_RATE;
      var currentEpoch = 0;
      var currentLoss = 0;
      var frameCount = 0;
      var epochsPerFrame = Math.max(1, Math.floor(totalEpochs / 120)); // ~2 seconds at 60fps

      animState.animating = true;

      function doEpoch() {
        var loss = trainEpoch(samples, lr);
        currentLoss = loss;
        currentEpoch++;
        trainingLossHistory.push(loss);
        if (currentEpoch > 0 && currentEpoch % 100 === 0) lr *= 0.95;
      }

      function animateFrame() {
        if (!animState.animating) {
          resolve();
          return;
        }

        // 每帧训练若干 epoch / train several epochs per frame
        for (var e = 0; e < epochsPerFrame && currentEpoch < totalEpochs; e++) {
          doEpoch();
        }

        // 计算激活值用于可视化 / compute activations for visualization
        var sampleIdx = frameCount % samples.length;
        var sample = samples[sampleIdx];
        var out = forward(sample.input);

        var pulse = 0.5 + 0.5 * Math.sin(frameCount * 0.2);

        drawNetwork(canvas, {
          pulse: pulse,
          inputActivations: sample.input.map(function (v) { return Math.min(1, Math.abs(v) * 0.5 + 0.3); }),
          hiddenActivations: out.a1.map(function (v) { return Math.min(1, Math.abs(v) * 0.5 + 0.2); }),
          outputActivations: out.a2.map(function (v) { return Math.min(1, Math.abs(v) * 0.5 + 0.3); }),
          epoch: currentEpoch,
          totalEpochs: totalEpochs,
          loss: currentLoss
        });

        frameCount++;

        if (currentEpoch >= totalEpochs) {
          animState.animating = false;
          // Final draw
          drawNetwork(canvas, {
            pulse: 0.8,
            inputActivations: new Array(INPUT_SIZE).fill(0.6),
            hiddenActivations: new Array(HIDDEN_SIZE).fill(0.5),
            outputActivations: new Array(OUTPUT_SIZE).fill(0.7),
            epoch: totalEpochs,
            totalEpochs: totalEpochs,
            loss: currentLoss
          });
          resolve();
          return;
        }

        animState.rafId = requestAnimationFrame(animateFrame);
      }

      animState.rafId = requestAnimationFrame(animateFrame);
    });
  }

  function stopAnimation() {
    animState.animating = false;
    if (animState.rafId !== null) {
      cancelAnimationFrame(animState.rafId);
      animState.rafId = null;
    }
  }

  function reset() {
    stopAnimation();
    initWeights();
    lastPrediction = null;
    trainingLossHistory = [];
  }

  function getPrediction() {
    return lastPrediction;
  }

  // ============================================================
  // 导出 / Exports
  // ============================================================
  initWeights();

  return {
    predict: predict,
    train: train,
    drawNetwork: drawNetwork,
    animateTraining: animateTraining,
    stopAnimation: stopAnimation,
    getPrediction: getPrediction,
    reset: reset,
    INPUT_SIZE: INPUT_SIZE
  };
})();

// ============================================================
// 自检 / Self-test
// ============================================================
console.log('[nn] neural network module loaded');
if (typeof window !== 'undefined') {
  var testSeries = [1, 2, 3, 4, 5, 6, 7, 8];
  var preds = neuralNet.predict(testSeries, 3);
  console.log('[nn] sanity: predict([1..8], 3) =', preds.map(function (v) { return v.toFixed(4); }));
}
