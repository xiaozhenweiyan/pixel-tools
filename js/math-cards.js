/**
 * math-cards.js
 * 数学学习卡片模块 - 四则运算练习
 * Math Learning Cards Module - Arithmetic Practice
 *
 * 功能：
 *   - 加法、减法、乘法、除法四种运算
 *   - 每种 20 关，难度递增
 *   - 随机题目生成（减法非负、除法整除）
 *   - 进度追踪与星级评价
 *   - 错题回顾
 *   - 粒子特效动画
 *
 * 暴露到全局：window.MathCards
 *   - init() - 初始化
 *   - reset(op) - 重置指定运算
 *   - getCurrentState() - 获取当前状态
 */
(function () {
  'use strict';

  // ============================================================
  // 游戏状态 / Game State
  // ============================================================
  const TOTAL_LEVELS = 20;

  const state = {
    currentOp: 'add',
    currentLevel: 1,
    correctCount: 0,
    wrongCount: 0,
    wrongAnswers: [],
    currentQuestion: null,
    isAnswering: true
  };

  // 运算符符号 / Operator symbols
  const OP_SYMBOLS = {
    add: '+',
    subtract: '−',
    multiply: '×',
    divide: '÷'
  };

  // ============================================================
  // 工具函数 / Utility Functions
  // ============================================================

  /**
   * 生成指定范围内的随机整数
   * @param {number} min - 最小值（包含）
   * @param {number} max - 最大值（包含）
   * @returns {number}
   */
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 根据关卡和运算类型获取数字范围
   * @param {string} op - 运算类型
   * @param {number} level - 关卡 (1-20)
   * @returns {{min: number, max: number}}
   */
  function getNumberRange(op, level) {
    if (op === 'add' || op === 'subtract') {
      if (level <= 5) return { min: 0, max: 10 };
      if (level <= 10) return { min: 0, max: 20 };
      if (level <= 15) return { min: 0, max: 100 };
      return { min: 0, max: 1000 };
    }

    if (op === 'multiply') {
      if (level <= 5) return { min: 1, max: 5 };
      if (level <= 10) return { min: 1, max: 9 };
      if (level <= 15) return { minA: 10, maxA: 99, minB: 1, maxB: 9 };
      return { minA: 10, maxA: 99, minB: 10, maxB: 99 };
    }

    if (op === 'divide') {
      if (level <= 5) return { min: 1, max: 5 };
      if (level <= 10) return { min: 1, max: 9 };
      if (level <= 15) return { minA: 10, maxA: 99, minB: 1, maxB: 9 };
      return { minA: 10, maxA: 99, minB: 10, maxB: 99 };
    }

    return { min: 0, max: 10 };
  }

  /**
   * 生成一道题目
   * @param {string} op - 运算类型
   * @param {number} level - 关卡
   * @returns {{num1: number, num2: number, answer: number, op: string}}
   */
  function generateQuestion(op, level) {
    const range = getNumberRange(op, level);
    let num1, num2, answer;

    switch (op) {
      case 'add':
        num1 = randomInt(range.min, range.max);
        num2 = randomInt(range.min, range.max);
        answer = num1 + num2;
        break;

      case 'subtract':
        num1 = randomInt(range.min, range.max);
        num2 = randomInt(range.min, range.max);
        if (num1 < num2) {
          var temp = num1;
          num1 = num2;
          num2 = temp;
        }
        answer = num1 - num2;
        break;

      case 'multiply':
        if (level <= 10) {
          num1 = randomInt(range.min, range.max);
          num2 = randomInt(range.min, range.max);
        } else {
          num1 = randomInt(range.minA, range.maxA);
          num2 = randomInt(range.minB, range.maxB);
        }
        answer = num1 * num2;
        break;

      case 'divide':
        if (level <= 10) {
          num2 = randomInt(range.min, range.max);
          answer = randomInt(range.min, range.max);
          num1 = num2 * answer;
        } else {
          num2 = randomInt(range.minB, range.maxB);
          answer = randomInt(range.minA, range.maxA);
          num1 = num2 * answer;
        }
        break;

      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
    }

    return {
      num1: num1,
      num2: num2,
      answer: answer,
      op: op
    };
  }

  // ============================================================
  // DOM 元素引用 / DOM Element References
  // ============================================================
  let els = {};

  function cacheElements() {
    els = {
      page: document.getElementById('arithmetic-page'),
      tabs: document.getElementById('arithmetic-tabs'),
      tabButtons: document.querySelectorAll('.arithmetic-tab'),
      gameArea: document.getElementById('arithmetic-game-area'),
      resultPage: document.getElementById('arithmetic-result'),
      levelText: document.getElementById('arithmetic-level-text'),
      progressFill: document.getElementById('arithmetic-progress-fill'),
      stars: document.querySelectorAll('#arithmetic-stars .arithmetic-star'),
      question: document.getElementById('arithmetic-question'),
      num1: document.getElementById('arith-num1'),
      num2: document.getElementById('arith-num2'),
      opDisplay: document.getElementById('arith-op'),
      input: document.getElementById('arithmetic-input'),
      submitBtn: document.getElementById('arithmetic-submit'),
      wrongHint: document.getElementById('arithmetic-wrong-hint'),
      correctVal: document.getElementById('arith-correct-val'),
      continueBtn: document.getElementById('arithmetic-continue'),
      resultStars: document.querySelectorAll('#arithmetic-result-stars .arithmetic-result-star'),
      correctCount: document.getElementById('arith-correct-count'),
      wrongCount: document.getElementById('arith-wrong-count'),
      ratingText: document.getElementById('arith-rating-text'),
      wrongReview: document.getElementById('arithmetic-wrong-review'),
      reviewList: document.getElementById('arithmetic-review-list'),
      retryBtn: document.getElementById('arithmetic-retry'),
      particles: document.getElementById('arithmetic-particles')
    };
  }

  // ============================================================
  // UI 更新 / UI Updates
  // ============================================================

  /**
   * 更新进度条和关卡显示
   */
  function updateProgress() {
    if (!els.levelText || !els.progressFill) return;
    els.levelText.textContent = state.currentLevel + ' / ' + TOTAL_LEVELS;
    var pct = (state.currentLevel / TOTAL_LEVELS) * 100;
    els.progressFill.style.width = pct + '%';
  }

  /**
   * 更新星级显示（基于当前正确率）
   */
  function updateStars() {
    if (!els.stars || els.stars.length === 0) return;
    var total = state.correctCount + state.wrongCount;
    var starCount = 0;

    if (total > 0) {
      var accuracy = state.correctCount / total;
      if (accuracy >= 0.95) starCount = 3;
      else if (accuracy >= 0.85) starCount = 2;
      else if (accuracy >= 0.7) starCount = 1;
    }

    for (var i = 0; i < els.stars.length; i++) {
      if (i < starCount) {
        if (!els.stars[i].classList.contains('filled')) {
          els.stars[i].classList.remove('empty');
          els.stars[i].classList.add('filled');
        }
      } else {
        els.stars[i].classList.remove('filled');
        els.stars[i].classList.add('empty');
      }
    }
  }

  /**
   * 显示当前题目
   */
  function displayQuestion() {
    if (!els.num1 || !els.num2 || !els.opDisplay || !els.question) return;

    var q = state.currentQuestion;
    els.num1.textContent = q.num1;
    els.num2.textContent = q.num2;
    els.opDisplay.textContent = OP_SYMBOLS[q.op];

    els.question.classList.remove('correct', 'wrong');
    void els.question.offsetWidth;
    els.question.style.animation = 'none';
    void els.question.offsetWidth;
    els.question.style.animation = '';
  }

  /**
   * 重置输入框
   */
  function resetInput() {
    if (els.input) {
      els.input.value = '';
      els.input.disabled = false;
      setTimeout(function () {
        els.input.focus();
      }, 100);
    }
  }

  /**
   * 隐藏答错提示
   */
  function hideWrongHint() {
    if (els.wrongHint) {
      els.wrongHint.style.display = 'none';
    }
  }

  /**
   * 显示答错提示
   * @param {number} correctAnswer - 正确答案
   */
  function showWrongHint(correctAnswer) {
    if (!els.wrongHint || !els.correctVal) return;
    els.correctVal.textContent = correctAnswer;
    els.wrongHint.style.display = 'block';
  }

  // ============================================================
  // 粒子特效 / Particle Effects
  // ============================================================

  /**
   * 创建金色星星粒子效果
   * @param {number} x - 中心 X 坐标
   * @param {number} y - 中心 Y 坐标
   * @param {number} count - 粒子数量
   */
  function createStarParticles(x, y, count) {
    if (!els.particles) return;

    var particles = [];
    for (var i = 0; i < count; i++) {
      var particle = document.createElement('span');
      particle.className = 'arithmetic-particle';
      particle.textContent = '★';
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      particle.style.color = i % 2 === 0 ? '#ffd700' : '#ffed4a';

      var angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      var distance = 60 + Math.random() * 80;
      var tx = Math.cos(angle) * distance;
      var ty = Math.sin(angle) * distance - 50;
      var rot = (Math.random() - 0.5) * 360 + 'deg';

      particle.style.setProperty('--tx', tx + 'px');
      particle.style.setProperty('--ty', ty + 'px');
      particle.style.setProperty('--rot', rot);
      particle.style.fontSize = (14 + Math.random() * 16) + 'px';

      els.particles.appendChild(particle);
      particles.push(particle);
    }

    setTimeout(function () {
      for (var j = 0; j < particles.length; j++) {
        if (particles[j].parentNode) {
          particles[j].parentNode.removeChild(particles[j]);
        }
      }
    }, 1000);
  }

  // ============================================================
  // 游戏逻辑 / Game Logic
  // ============================================================

  /**
   * 开始新的一关
   */
  function nextLevel() {
    if (state.currentLevel > TOTAL_LEVELS) {
      showResult();
      return;
    }

    state.currentQuestion = generateQuestion(state.currentOp, state.currentLevel);
    state.isAnswering = true;

    hideWrongHint();
    displayQuestion();
    updateProgress();
    updateStars();
    resetInput();
  }

  /**
   * 检查答案
   */
  function checkAnswer() {
    if (!state.isAnswering || !state.currentQuestion || !els.input) return;

    var userAnswer = parseInt(els.input.value, 10);
    if (isNaN(userAnswer)) return;

    state.isAnswering = false;
    els.input.disabled = true;

    var isCorrect = userAnswer === state.currentQuestion.answer;

    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer(userAnswer);
    }
  }

  /**
   * 处理答对
   */
  function handleCorrectAnswer() {
    state.correctCount++;

    if (els.question) {
      els.question.classList.add('correct');
    }

    var rect = els.question ? els.question.getBoundingClientRect() : null;
    if (rect) {
      createStarParticles(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        12
      );
    }

    setTimeout(function () {
      state.currentLevel++;
      nextLevel();
    }, 500);
  }

  /**
   * 处理答错
   * @param {number} userAnswer - 用户答案
   */
  function handleWrongAnswer(userAnswer) {
    state.wrongCount++;

    state.wrongAnswers.push({
      num1: state.currentQuestion.num1,
      num2: state.currentQuestion.num2,
      op: state.currentQuestion.op,
      userAnswer: userAnswer,
      correctAnswer: state.currentQuestion.answer
    });

    if (els.question) {
      els.question.classList.add('wrong');
    }

    showWrongHint(state.currentQuestion.answer);
    updateStars();
  }

  /**
   * 继续下一题（答错后）
   */
  function continueAfterWrong() {
    state.currentLevel++;
    nextLevel();
  }

  // ============================================================
  // 结果页 / Result Page
  // ============================================================

  /**
   * 计算星级评价
   * @returns {number} 1-3 星
   */
  function calculateStarRating() {
    if (state.wrongCount === 0) return 3;
    if (state.wrongCount <= 2) return 2;
    return 1;
  }

  /**
   * 显示结果页
   */
  function showResult() {
    if (!els.gameArea || !els.resultPage) return;

    els.gameArea.style.display = 'none';
    els.resultPage.style.display = 'block';

    var stars = calculateStarRating();

    if (els.correctCount) els.correctCount.textContent = state.correctCount;
    if (els.wrongCount) els.wrongCount.textContent = state.wrongCount;

    if (els.ratingText) {
      var ratingKey = 'rating_' + stars + 'star';
      els.ratingText.innerHTML = '<span data-i18n="' + ratingKey + '">' + i18n.t(ratingKey) + '</span>';
    }

    if (els.resultStars) {
      for (var i = 0; i < els.resultStars.length; i++) {
        els.resultStars[i].classList.remove('lit');
      }

      var _loop = function (i) {
        setTimeout(function () {
          if (i < stars && els.resultStars[i]) {
            els.resultStars[i].classList.add('lit');
          }
        }, 300 + i * 300);
      };

      for (var i = 0; i < els.resultStars.length; i++) {
        _loop(i);
      }
    }

    if (state.wrongAnswers.length > 0 && els.wrongReview && els.reviewList) {
      els.wrongReview.style.display = 'block';
      renderWrongReview();
    } else if (els.wrongReview) {
      els.wrongReview.style.display = 'none';
    }
  }

  /**
   * 渲染错题回顾列表
   */
  function renderWrongReview() {
    if (!els.reviewList) return;

    while (els.reviewList.firstChild) {
      els.reviewList.removeChild(els.reviewList.firstChild);
    }

    for (var i = 0; i < state.wrongAnswers.length; i++) {
      var item = state.wrongAnswers[i];
      var div = document.createElement('div');
      div.className = 'arithmetic-review-item';

      var questionDiv = document.createElement('span');
      questionDiv.className = 'arithmetic-review-question';
      questionDiv.textContent =
        item.num1 + ' ' + OP_SYMBOLS[item.op] + ' ' + item.num2 + ' =';

      var answersDiv = document.createElement('span');
      answersDiv.className = 'arithmetic-review-answers';

      var userSpan = document.createElement('span');
      userSpan.className = 'arithmetic-review-user';
      userSpan.textContent = item.userAnswer;

      var correctSpan = document.createElement('span');
      correctSpan.className = 'arithmetic-review-correct';
      correctSpan.textContent = item.correctAnswer;

      answersDiv.appendChild(userSpan);
      answersDiv.appendChild(correctSpan);

      div.appendChild(questionDiv);
      div.appendChild(answersDiv);

      els.reviewList.appendChild(div);
    }
  }

  /**
   * 重置游戏
   * @param {string} [op] - 可选，指定运算类型
   */
  function resetGame(op) {
    if (op) {
      state.currentOp = op;
    }

    state.currentLevel = 1;
    state.correctCount = 0;
    state.wrongCount = 0;
    state.wrongAnswers = [];
    state.currentQuestion = null;
    state.isAnswering = true;

    if (els.gameArea) els.gameArea.style.display = 'block';
    if (els.resultPage) els.resultPage.style.display = 'none';

    if (els.resultStars) {
      for (var i = 0; i < els.resultStars.length; i++) {
        els.resultStars[i].classList.remove('lit');
      }
    }

    nextLevel();
  }

  // ============================================================
  // Tab 切换 / Tab Switching
  // ============================================================

  /**
   * 切换运算类型
   * @param {string} op - 运算类型
   */
  function switchOperation(op) {
    if (state.currentOp === op) return;

    state.currentOp = op;

    if (els.tabButtons) {
      for (var i = 0; i < els.tabButtons.length; i++) {
        var btn = els.tabButtons[i];
        if (btn.getAttribute('data-op') === op) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    }

    resetGame();
  }

  // ============================================================
  // 事件绑定 / Event Binding
  // ============================================================

  function bindEvents() {
    if (els.tabs) {
      els.tabs.addEventListener('click', function (e) {
        var target = e.target;
        while (target && target !== els.tabs) {
          if (target.classList && target.classList.contains('arithmetic-tab')) {
            var op = target.getAttribute('data-op');
            if (op) {
              switchOperation(op);
            }
            return;
          }
          target = target.parentNode;
        }
      });
    }

    if (els.submitBtn) {
      els.submitBtn.addEventListener('click', checkAnswer);
    }

    if (els.input) {
      els.input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          checkAnswer();
        }
      });
    }

    if (els.continueBtn) {
      els.continueBtn.addEventListener('click', continueAfterWrong);
    }

    if (els.retryBtn) {
      els.retryBtn.addEventListener('click', function () {
        resetGame();
      });
    }

    var backBtn = document.getElementById('btn-back-to-learning');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (typeof window.showLearningLanding === 'function') {
          window.showLearningLanding();
        }
      });
    }
  }

  // ============================================================
  // 初始化 / Initialization
  // ============================================================

  function init() {
    cacheElements();

    if (!els.page) {
      console.warn('[MathCards] arithmetic-page not found');
      return;
    }

    bindEvents();
    resetGame('add');
  }

  function getCurrentState() {
    return {
      currentOp: state.currentOp,
      currentLevel: state.currentLevel,
      correctCount: state.correctCount,
      wrongCount: state.wrongCount,
      totalLevels: TOTAL_LEVELS
    };
  }

  // ============================================================
  // 混合运算 / Mixed Arithmetic Operations
  // ============================================================

  const MIXED_TOTAL_LEVELS = 15;

  const mixedState = {
    currentDifficulty: 'easy',
    currentLevel: 1,
    correctCount: 0,
    wrongCount: 0,
    wrongAnswers: [],
    currentQuestion: null,
    isAnswering: true
  };

  const MIXED_DIFFICULTIES = ['easy', 'medium', 'hard'];

  const DIFFICULTY_LABELS = {
    easy: { zh: '简单', en: 'EASY' },
    medium: { zh: '中等', en: 'MEDIUM' },
    hard: { zh: '困难', en: 'HARD' }
  };

  function generateEasyMixedQuestion(level) {
    var maxNum;
    if (level <= 5) maxNum = 10;
    else if (level <= 10) maxNum = 20;
    else maxNum = 50;

    var a = randomInt(0, maxNum);
    var b = randomInt(0, maxNum);
    var c = randomInt(0, maxNum);

    var isAddFirst = Math.random() < 0.5;
    var expression, answer, steps;

    if (isAddFirst) {
      var sum = a + b;
      while (sum - c < 0) {
        c = randomInt(0, sum);
      }
      answer = sum - c;
      expression = a + ' + ' + b + ' − ' + c;
      steps = [
        a + ' + ' + b + ' = ' + sum,
        sum + ' − ' + c + ' = ' + answer
      ];
    } else {
      if (a < b) {
        var temp = a;
        a = b;
        b = temp;
      }
      var diff = a - b;
      answer = diff + c;
      expression = a + ' − ' + b + ' + ' + c;
      steps = [
        a + ' − ' + b + ' = ' + diff,
        diff + ' + ' + c + ' = ' + answer
      ];
    }

    return {
      expression: expression,
      answer: answer,
      steps: steps,
      difficulty: 'easy'
    };
  }

  function generateMediumMixedQuestion(level) {
    var addMax;
    if (level <= 5) addMax = 10;
    else if (level <= 10) addMax = 15;
    else addMax = 20;

    var mulMax = 9;

    var b = randomInt(1, mulMax);
    var c = randomInt(1, mulMax);
    var product = b * c;

    var a = randomInt(0, addMax);

    var isMulFirst = Math.random() < 0.5;
    var expression, answer, steps;

    if (isMulFirst) {
      answer = a + product;
      expression = a + ' + ' + b + ' × ' + c;
      steps = [
        b + ' × ' + c + ' = ' + product,
        a + ' + ' + product + ' = ' + answer
      ];
    } else {
      while (product - a < 0) {
        a = randomInt(0, product);
      }
      answer = product - a;
      expression = b + ' × ' + c + ' − ' + a;
      steps = [
        b + ' × ' + c + ' = ' + product,
        product + ' − ' + a + ' = ' + answer
      ];
    }

    return {
      expression: expression,
      answer: answer,
      steps: steps,
      difficulty: 'medium'
    };
  }

  function generateHardMixedQuestion(level) {
    var type = randomInt(0, 2);
    var expression, answer, steps;

    var twoDigitMax, oneDigitMax, addMax;
    if (level <= 5) {
      twoDigitMax = 20;
      oneDigitMax = 5;
      addMax = 50;
    } else if (level <= 10) {
      twoDigitMax = 50;
      oneDigitMax = 7;
      addMax = 80;
    } else {
      twoDigitMax = 99;
      oneDigitMax = 9;
      addMax = 100;
    }

    if (type === 0) {
      var a1 = randomInt(1, twoDigitMax);
      var b1 = randomInt(1, twoDigitMax);
      var c1 = randomInt(1, oneDigitMax);
      var sum1 = a1 + b1;
      answer = sum1 * c1;
      expression = '(' + a1 + ' + ' + b1 + ') × ' + c1;
      steps = [
        a1 + ' + ' + b1 + ' = ' + sum1,
        sum1 + ' × ' + c1 + ' = ' + answer
      ];
    } else if (type === 1) {
      var a2 = randomInt(1, oneDigitMax);
      var b2 = randomInt(1, twoDigitMax);
      var c2 = randomInt(1, twoDigitMax);
      var sum2 = b2 + c2;
      answer = a2 * sum2;
      expression = a2 + ' × (' + b2 + ' + ' + c2 + ')';
      steps = [
        b2 + ' + ' + c2 + ' = ' + sum2,
        a2 + ' × ' + sum2 + ' = ' + answer
      ];
    } else {
      var a3 = randomInt(1, Math.floor(addMax / 2));
      var b3 = randomInt(1, oneDigitMax);
      var c3 = randomInt(1, oneDigitMax);
      var d3 = randomInt(1, Math.floor(addMax / 2));
      var product3 = b3 * c3;
      var tempResult = a3 + product3;
      while (tempResult - d3 < 0) {
        d3 = randomInt(1, tempResult);
      }
      answer = tempResult - d3;
      expression = a3 + ' + ' + b3 + ' × ' + c3 + ' − ' + d3;
      steps = [
        b3 + ' × ' + c3 + ' = ' + product3,
        a3 + ' + ' + product3 + ' = ' + tempResult,
        tempResult + ' − ' + d3 + ' = ' + answer
      ];
    }

    return {
      expression: expression,
      answer: answer,
      steps: steps,
      difficulty: 'hard'
    };
  }

  function generateMixedQuestion(difficulty, level) {
    switch (difficulty) {
      case 'easy':
        return generateEasyMixedQuestion(level);
      case 'medium':
        return generateMediumMixedQuestion(level);
      case 'hard':
        return generateHardMixedQuestion(level);
      default:
        return generateEasyMixedQuestion(level);
    }
  }

  // ============================================================
  // 混合运算 DOM 元素引用 / Mixed Arithmetic DOM References
  // ============================================================
  let mixedEls = {};

  function cacheMixedElements() {
    mixedEls = {
      page: document.getElementById('mixed-arithmetic-page'),
      tabs: document.getElementById('mixed-arithmetic-tabs'),
      tabButtons: document.querySelectorAll('.mixed-arithmetic-tab'),
      gameArea: document.getElementById('mixed-arithmetic-game-area'),
      resultPage: document.getElementById('mixed-arithmetic-result'),
      levelText: document.getElementById('mixed-arithmetic-level-text'),
      progressFill: document.getElementById('mixed-arithmetic-progress-fill'),
      stars: document.querySelectorAll('#mixed-arithmetic-stars .mixed-arithmetic-star'),
      question: document.getElementById('mixed-arithmetic-question'),
      expressionDisplay: document.getElementById('mixed-expression'),
      input: document.getElementById('mixed-arithmetic-input'),
      submitBtn: document.getElementById('mixed-arithmetic-submit'),
      wrongHint: document.getElementById('mixed-arithmetic-wrong-hint'),
      correctVal: document.getElementById('mixed-correct-val'),
      continueBtn: document.getElementById('mixed-arithmetic-continue'),
      resultStars: document.querySelectorAll('#mixed-arithmetic-result-stars .mixed-arithmetic-result-star'),
      correctCount: document.getElementById('mixed-correct-count'),
      wrongCount: document.getElementById('mixed-wrong-count'),
      ratingText: document.getElementById('mixed-rating-text'),
      wrongReview: document.getElementById('mixed-arithmetic-wrong-review'),
      reviewList: document.getElementById('mixed-arithmetic-review-list'),
      retryBtn: document.getElementById('mixed-arithmetic-retry'),
      particles: document.getElementById('mixed-arithmetic-particles')
    };
  }

  // ============================================================
  // 混合运算 UI 更新 / Mixed Arithmetic UI Updates
  // ============================================================

  function updateMixedProgress() {
    if (!mixedEls.levelText || !mixedEls.progressFill) return;
    mixedEls.levelText.textContent = mixedState.currentLevel + ' / ' + MIXED_TOTAL_LEVELS;
    var pct = (mixedState.currentLevel / MIXED_TOTAL_LEVELS) * 100;
    mixedEls.progressFill.style.width = pct + '%';
  }

  function updateMixedStars() {
    if (!mixedEls.stars || mixedEls.stars.length === 0) return;
    var total = mixedState.correctCount + mixedState.wrongCount;
    var starCount = 0;

    if (total > 0) {
      var accuracy = mixedState.correctCount / total;
      if (accuracy >= 0.95) starCount = 3;
      else if (accuracy >= 0.85) starCount = 2;
      else if (accuracy >= 0.7) starCount = 1;
    }

    for (var i = 0; i < mixedEls.stars.length; i++) {
      if (i < starCount) {
        if (!mixedEls.stars[i].classList.contains('filled')) {
          mixedEls.stars[i].classList.remove('empty');
          mixedEls.stars[i].classList.add('filled');
        }
      } else {
        mixedEls.stars[i].classList.remove('filled');
        mixedEls.stars[i].classList.add('empty');
      }
    }
  }

  function displayMixedQuestion() {
    if (!mixedEls.expressionDisplay || !mixedEls.question) return;

    var q = mixedState.currentQuestion;
    mixedEls.expressionDisplay.textContent = q.expression + ' =';

    mixedEls.question.classList.remove('correct', 'wrong');
    void mixedEls.question.offsetWidth;
    mixedEls.question.style.animation = 'none';
    void mixedEls.question.offsetWidth;
    mixedEls.question.style.animation = '';
  }

  function resetMixedInput() {
    if (mixedEls.input) {
      mixedEls.input.value = '';
      mixedEls.input.disabled = false;
      setTimeout(function () {
        mixedEls.input.focus();
      }, 100);
    }
  }

  function hideMixedWrongHint() {
    if (mixedEls.wrongHint) {
      mixedEls.wrongHint.style.display = 'none';
    }
  }

  function showMixedWrongHint(correctAnswer) {
    if (!mixedEls.wrongHint || !mixedEls.correctVal) return;
    mixedEls.correctVal.textContent = correctAnswer;
    mixedEls.wrongHint.style.display = 'block';
  }

  // ============================================================
  // 混合运算粒子特效 / Mixed Arithmetic Particle Effects
  // ============================================================

  function createMixedStarParticles(x, y, count) {
    if (!mixedEls.particles) return;

    var particles = [];
    for (var i = 0; i < count; i++) {
      var particle = document.createElement('span');
      particle.className = 'arithmetic-particle';
      particle.textContent = '★';
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      particle.style.color = i % 2 === 0 ? '#ffd700' : '#ffed4a';

      var angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      var distance = 60 + Math.random() * 80;
      var tx = Math.cos(angle) * distance;
      var ty = Math.sin(angle) * distance - 50;
      var rot = (Math.random() - 0.5) * 360 + 'deg';

      particle.style.setProperty('--tx', tx + 'px');
      particle.style.setProperty('--ty', ty + 'px');
      particle.style.setProperty('--rot', rot);
      particle.style.fontSize = (14 + Math.random() * 16) + 'px';

      mixedEls.particles.appendChild(particle);
      particles.push(particle);
    }

    setTimeout(function () {
      for (var j = 0; j < particles.length; j++) {
        if (particles[j].parentNode) {
          particles[j].parentNode.removeChild(particles[j]);
        }
      }
    }, 1000);
  }

  // ============================================================
  // 混合运算游戏逻辑 / Mixed Arithmetic Game Logic
  // ============================================================

  function nextMixedLevel() {
    if (mixedState.currentLevel > MIXED_TOTAL_LEVELS) {
      showMixedResult();
      return;
    }

    mixedState.currentQuestion = generateMixedQuestion(mixedState.currentDifficulty, mixedState.currentLevel);
    mixedState.isAnswering = true;

    hideMixedWrongHint();
    displayMixedQuestion();
    updateMixedProgress();
    updateMixedStars();
    resetMixedInput();
  }

  function checkMixedAnswer() {
    if (!mixedState.isAnswering || !mixedState.currentQuestion || !mixedEls.input) return;

    var userAnswer = parseInt(mixedEls.input.value, 10);
    if (isNaN(userAnswer)) return;

    mixedState.isAnswering = false;
    mixedEls.input.disabled = true;

    var isCorrect = userAnswer === mixedState.currentQuestion.answer;

    if (isCorrect) {
      handleMixedCorrectAnswer();
    } else {
      handleMixedWrongAnswer(userAnswer);
    }
  }

  function handleMixedCorrectAnswer() {
    mixedState.correctCount++;

    if (mixedEls.question) {
      mixedEls.question.classList.add('correct');
    }

    var rect = mixedEls.question ? mixedEls.question.getBoundingClientRect() : null;
    if (rect) {
      createMixedStarParticles(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        12
      );
    }

    setTimeout(function () {
      mixedState.currentLevel++;
      nextMixedLevel();
    }, 500);
  }

  function handleMixedWrongAnswer(userAnswer) {
    mixedState.wrongCount++;

    mixedState.wrongAnswers.push({
      expression: mixedState.currentQuestion.expression,
      steps: mixedState.currentQuestion.steps,
      userAnswer: userAnswer,
      correctAnswer: mixedState.currentQuestion.answer
    });

    if (mixedEls.question) {
      mixedEls.question.classList.add('wrong');
    }

    showMixedWrongHint(mixedState.currentQuestion.answer);
    updateMixedStars();
  }

  function continueAfterMixedWrong() {
    mixedState.currentLevel++;
    nextMixedLevel();
  }

  // ============================================================
  // 混合运算结果页 / Mixed Arithmetic Result Page
  // ============================================================

  function calculateMixedStarRating() {
    if (mixedState.wrongCount === 0) return 3;
    if (mixedState.wrongCount <= 2) return 2;
    return 1;
  }

  function showMixedResult() {
    if (!mixedEls.gameArea || !mixedEls.resultPage) return;

    mixedEls.gameArea.style.display = 'none';
    mixedEls.resultPage.style.display = 'block';

    var stars = calculateMixedStarRating();

    if (mixedEls.correctCount) mixedEls.correctCount.textContent = mixedState.correctCount;
    if (mixedEls.wrongCount) mixedEls.wrongCount.textContent = mixedState.wrongCount;

    if (mixedEls.ratingText) {
      var ratingKey = 'rating_' + stars + 'star';
      mixedEls.ratingText.innerHTML = '<span data-i18n="' + ratingKey + '">' + i18n.t(ratingKey) + '</span>';
    }

    if (mixedEls.resultStars) {
      for (var i = 0; i < mixedEls.resultStars.length; i++) {
        mixedEls.resultStars[i].classList.remove('lit');
      }

      var _loop = function (i) {
        setTimeout(function () {
          if (i < stars && mixedEls.resultStars[i]) {
            mixedEls.resultStars[i].classList.add('lit');
          }
        }, 300 + i * 300);
      };

      for (var i = 0; i < mixedEls.resultStars.length; i++) {
        _loop(i);
      }
    }

    if (mixedState.wrongAnswers.length > 0 && mixedEls.wrongReview && mixedEls.reviewList) {
      mixedEls.wrongReview.style.display = 'block';
      renderMixedWrongReview();
    } else if (mixedEls.wrongReview) {
      mixedEls.wrongReview.style.display = 'none';
    }
  }

  function renderMixedWrongReview() {
    if (!mixedEls.reviewList) return;

    while (mixedEls.reviewList.firstChild) {
      mixedEls.reviewList.removeChild(mixedEls.reviewList.firstChild);
    }

    for (var i = 0; i < mixedState.wrongAnswers.length; i++) {
      var item = mixedState.wrongAnswers[i];
      var div = document.createElement('div');
      div.className = 'arithmetic-review-item';

      var questionDiv = document.createElement('div');
      questionDiv.className = 'arithmetic-review-question';
      questionDiv.textContent = item.expression + ' =';

      var answersDiv = document.createElement('div');
      answersDiv.className = 'arithmetic-review-answers';

      var userSpan = document.createElement('span');
      userSpan.className = 'arithmetic-review-user';
      userSpan.textContent = item.userAnswer;

      var correctSpan = document.createElement('span');
      correctSpan.className = 'arithmetic-review-correct';
      correctSpan.textContent = item.correctAnswer;

      answersDiv.appendChild(userSpan);
      answersDiv.appendChild(correctSpan);

      var stepsDiv = document.createElement('div');
      stepsDiv.className = 'mixed-review-steps';
      var stepsLabel = document.createElement('div');
      stepsLabel.className = 'mixed-steps-label';
      stepsLabel.setAttribute('data-i18n', 'mixed_steps_label');
      stepsLabel.textContent = i18n.t('mixed_steps_label');
      stepsDiv.appendChild(stepsLabel);

      for (var j = 0; j < item.steps.length; j++) {
        var stepDiv = document.createElement('div');
        stepDiv.className = 'mixed-step-line';
        stepDiv.textContent = item.steps[j];
        stepsDiv.appendChild(stepDiv);
      }

      div.appendChild(questionDiv);
      div.appendChild(answersDiv);
      div.appendChild(stepsDiv);

      mixedEls.reviewList.appendChild(div);
    }
  }

  /**
   * 重置混合运算游戏
   * @param {string} [difficulty] - 可选，指定难度
   */
  function resetMixedGame(difficulty) {
    if (difficulty) {
      mixedState.currentDifficulty = difficulty;
    }

    mixedState.currentLevel = 1;
    mixedState.correctCount = 0;
    mixedState.wrongCount = 0;
    mixedState.wrongAnswers = [];
    mixedState.currentQuestion = null;
    mixedState.isAnswering = true;

    if (mixedEls.gameArea) mixedEls.gameArea.style.display = 'block';
    if (mixedEls.resultPage) mixedEls.resultPage.style.display = 'none';

    if (mixedEls.resultStars) {
      for (var i = 0; i < mixedEls.resultStars.length; i++) {
        mixedEls.resultStars[i].classList.remove('lit');
      }
    }

    nextMixedLevel();
  }

  // ============================================================
  // 混合运算 Tab 切换 / Mixed Arithmetic Tab Switching
  // ============================================================

  function switchMixedDifficulty(difficulty) {
    if (mixedState.currentDifficulty === difficulty) return;

    mixedState.currentDifficulty = difficulty;

    if (mixedEls.tabButtons) {
      for (var i = 0; i < mixedEls.tabButtons.length; i++) {
        var btn = mixedEls.tabButtons[i];
        if (btn.getAttribute('data-difficulty') === difficulty) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    }

    resetMixedGame();
  }

  // ============================================================
  // 混合运算事件绑定 / Mixed Arithmetic Event Binding
  // ============================================================

  function bindMixedEvents() {
    if (mixedEls.tabs) {
      mixedEls.tabs.addEventListener('click', function (e) {
        var target = e.target;
        while (target && target !== mixedEls.tabs) {
          if (target.classList && target.classList.contains('mixed-arithmetic-tab')) {
            var difficulty = target.getAttribute('data-difficulty');
            if (difficulty) {
              switchMixedDifficulty(difficulty);
            }
            return;
          }
          target = target.parentNode;
        }
      });
    }

    if (mixedEls.submitBtn) {
      mixedEls.submitBtn.addEventListener('click', checkMixedAnswer);
    }

    if (mixedEls.input) {
      mixedEls.input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          checkMixedAnswer();
        }
      });
    }

    if (mixedEls.continueBtn) {
      mixedEls.continueBtn.addEventListener('click', continueAfterMixedWrong);
    }

    if (mixedEls.retryBtn) {
      mixedEls.retryBtn.addEventListener('click', function () {
        resetMixedGame();
      });
    }

    var backBtn = document.getElementById('btn-back-to-learning-mixed');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (typeof window.showLearningLanding === 'function') {
          window.showLearningLanding();
        }
      });
    }
  }

  // ============================================================
  // 混合运算初始化 / Mixed Arithmetic Initialization
  // ============================================================

  function initMixed() {
    cacheMixedElements();

    if (!mixedEls.page) {
      console.warn('[MathCards] mixed-arithmetic-page not found');
      return;
    }

    bindMixedEvents();
    resetMixedGame('easy');
  }

  function getMixedCurrentState() {
    return {
      currentDifficulty: mixedState.currentDifficulty,
      currentLevel: mixedState.currentLevel,
      correctCount: mixedState.correctCount,
      wrongCount: mixedState.wrongCount,
      totalLevels: MIXED_TOTAL_LEVELS
    };
  }

  // 暴露到全局 / Expose to global
  window.MathCards = {
    init: init,
    reset: resetGame,
    switchOperation: switchOperation,
    getCurrentState: getCurrentState,
    generateQuestion: generateQuestion,
    TOTAL_LEVELS: TOTAL_LEVELS,
    OP_SYMBOLS: OP_SYMBOLS,
    initMixed: initMixed,
    resetMixed: resetMixedGame,
    switchMixedDifficulty: switchMixedDifficulty,
    getMixedCurrentState: getMixedCurrentState,
    generateMixedQuestion: generateMixedQuestion,
    MIXED_TOTAL_LEVELS: MIXED_TOTAL_LEVELS
  };
})();
