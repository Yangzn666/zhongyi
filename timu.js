// timu.js

// 定义题库文件路径（使用相对路径，避免特殊字符问题）
const quizFiles = {
    0: 'xz.json',    // 选择题
    1: 'tk.json',    // 填空题
    2: 'pd.json',    // 判断题
};

// 初始化变量
let currentQuiz = null;
let currentQuestionIndex = 0;
let answeredCount = 0;
let score = 0;
let currentTimer = null;  // 添加计时器引用

// 获取DOM元素
const questionContainer = document.getElementById('question-container');
const submitButton = document.getElementById('submit-answer-button');
const feedbackElement = document.getElementById('feedback');
const answeredCountElement = document.getElementById('answered-count');
const scoreElement = document.getElementById('score');
const accuracyElement = document.getElementById('accuracy');
const quizSelect = document.getElementById('quiz-select');
const loadQuizButton = document.getElementById('load-quiz-button');

// 倒计时相关元素
const countdownText = document.querySelector('.countdown-text');
const countdownProgress = document.querySelector('.countdown-progress');

// 加载单一类型题库
function loadSingleTypeQuiz(quizNumber) {
    // 清空之前的题目
    questionContainer.innerHTML = '';
    feedbackElement.style.display = 'none';
    submitButton.disabled = true;
    answeredCount = 0;
    score = 0;
    currentQuestionIndex = 0;
    updateStats();

    // 检查是否选择了有效的题库
    if (!quizNumber || !quizFiles[quizNumber]) {
        alert('请选择一个有效的题库');
        return;
    }

    // 使用fetch API加载JSON文件
    fetch(quizFiles[quizNumber])
        .then(response => response.json())
        .then(data => {
            currentQuiz = data;
            if (currentQuiz.length > 0) {
                renderQuestion();
                submitButton.disabled = false;
            } else {
                questionContainer.innerHTML = '<p>题库为空</p>';
            }
        })
        .catch(error => {
            console.error('加载题库时出错:', error);
            alert('无法加载题库，请稍后再试');
        });
}

// 新增：加载混合题库（xz: 选择题 x20, tk: 填空题 x20, pd: 判断题 x10）
function loadMixedQuiz() {
    Promise.all([
        fetch(quizFiles[0]).then(res => res.json()), // xz.json - 选择题
        fetch(quizFiles[1]).then(res => res.json()), // tk.json - 填空题
        fetch(quizFiles[2]).then(res => res.json())  // pd.json - 判断题
    ]).then(([xzData, tkData, pdData]) => {
        const getRandomQuestions = (arr, count) =>
            [...arr]
                .sort(() => Math.random() - 0.5)
                .slice(0, count);

        const selectedXZ = getRandomQuestions(xzData, 20); // 选20道选择题
        const selectedTK = getRandomQuestions(tkData, 20); // 选20道填空题
        const selectedPD = getRandomQuestions(pdData, 10); // 选10道判断题

        currentQuiz = [...selectedXZ, ...selectedTK, ...selectedPD]; // 合并题目
        currentQuestionIndex = 0;
        answeredCount = 0;
        score = 0;
        updateStats();
        renderQuestion();
        submitButton.disabled = false;
    }).catch(error => {
        console.error('加载题库时出错:', error);
        alert('无法加载题库，请稍后再试');
    });
}

// 渲染单个题目
function renderQuestion() {
    const question = currentQuiz[currentQuestionIndex];
    questionContainer.innerHTML = '';

    // 添加题目标题
    const questionTitle = document.createElement('h3');
    questionTitle.textContent = `${currentQuestionIndex + 1}. ${question.question}`;
    questionContainer.appendChild(questionTitle);

    // 判断题型并渲染对应控件
    if (question.options) {
        // 选择题：单选或复选
        const optionsList = document.createElement('ul');
        question.options.forEach((option, index) => {
            const optionItem = document.createElement('li');
            const optionInput = document.createElement('input');
            optionInput.type = 'radio'; // 强制单选题
            optionInput.name = 'answer';
            optionInput.value = index.toString();
            optionItem.appendChild(optionInput);
            const optionLabel = document.createElement('label');
            optionLabel.textContent = option;
            optionItem.appendChild(optionLabel);
            optionsList.appendChild(optionItem);
        });
        questionContainer.appendChild(optionsList);
    } else if (question.answer !== undefined) {
        // 填空题：添加文本输入框
        const answerInput = document.createElement('input');
        answerInput.type = 'text';
        answerInput.id = 'fill-blank-input';
        answerInput.placeholder = '请输入答案';
        answerInput.style.width = '100%';
        answerInput.style.padding = '10px';
        answerInput.style.marginTop = '15px';
        answerInput.style.borderRadius = '8px';
        answerInput.style.border = '1px solid #ccc';
        answerInput.style.fontSize = '1rem';
        answerInput.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        answerInput.style.transition = 'border-color 0.3s ease, box-shadow 0.3s ease';
        
        // 悬停和聚焦样式
        answerInput.addEventListener('focus', () => {
            answerInput.style.borderColor = '#2980b9';
            answerInput.style.boxShadow = '0 0 5px rgba(41, 128, 185, 0.5)';
        });
        answerInput.addEventListener('blur', () => {
            answerInput.style.borderColor = '#ccc';
            answerInput.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });

        questionContainer.appendChild(answerInput);
    }
}

function checkAnswer() {
    const question = currentQuiz[currentQuestionIndex];
    let userAnswers = [];

    if (question.options) {
        // 处理选择题
        const selectedInputs = document.querySelectorAll('input[name="answer"]:checked');
        selectedInputs.forEach(input => {
            userAnswers.push(parseInt(input.value));
        });

        if (userAnswers.length === 0) {
            alert('请选择一个选项');
            return;
        }

        const isCorrect = userAnswers[0] === question.correctAnswer;

        answeredCount++;
        if (isCorrect) {
            score += 2; // 修改为每道题2分
            feedbackElement.className = 'feedback correct';
            feedbackElement.textContent = '回答正确！';
        } else {
            feedbackElement.className = 'feedback incorrect';
            // 使用 ?? 提供默认值，防止 undefined 情况
            const correctOption = question.options?.[question.correctAnswer] ?? '未知';
            feedbackElement.textContent = `回答错误，正确答案是：${correctOption}`;
        }

        feedbackElement.style.display = 'block';
        updateStats();

        // 延迟跳转到下一题
        setTimeout(() => {
            if (currentQuestionIndex < currentQuiz.length - 1) {
                currentQuestionIndex++;
                renderQuestion();
                feedbackElement.style.display = 'none';
            } else {
                submitButton.disabled = true;
                // 显示总分
                feedbackElement.textContent = `所有题目已完成！您的总得分为：${score}分`;
            }
        }, isCorrect ? 1500 : 7000); // 正确延迟1.5秒，错误延迟7秒

    } else if (question.answer !== undefined) {
        // 处理填空题
        const inputElement = document.getElementById('fill-blank-input');
        const userAnswer = inputElement?.value.trim() ?? ''; // 安全访问输入框

        const isCorrect = userAnswer.toLowerCase() === (question.answer?.toLowerCase() ?? '');

        answeredCount++;
        if (isCorrect) {
            score += 2; // 修改为每道题2分
            feedbackElement.className = 'feedback correct';
            feedbackElement.textContent = '回答正确！';
        } else {
            feedbackElement.className = 'feedback incorrect';
            feedbackElement.textContent = `回答错误，正确答案是：${question.answer ?? '未知'}`;
        }

        feedbackElement.style.display = 'block';
        updateStats();

        // 延迟跳转到下一题
        setTimeout(() => {
            if (currentQuestionIndex < currentQuiz.length - 1) {
                currentQuestionIndex++;
                renderQuestion();
                feedbackElement.style.display = 'none';
            } else {
                submitButton.disabled = true;
                // 显示总分
                feedbackElement.textContent = `所有题目已完成！您的总得分为：${score}分`;
            }
        }, isCorrect ? 1500 : 7000); // 正确延迟1.5秒，错误延迟7秒
    }
}

// 比较两个数组是否相等
function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

// 更新答题统计信息
function updateStats() {
    answeredCountElement.textContent = answeredCount;
    scoreElement.textContent = score;
    accuracyElement.textContent = answeredCount > 0 ? ((score / answeredCount) * 100).toFixed(2) + '%' : '0%';
}

// 处理题库选择
loadQuizButton.addEventListener('click', () => {
    const selectedQuiz = quizSelect.value;
    if (selectedQuiz === '') {
        alert('请选择题库类型');
        return;
    }
    if (selectedQuiz === '3') { // 新增选项“混合题库”
        loadMixedQuiz();
    } else {
        loadSingleTypeQuiz(selectedQuiz);
    }
});

// 处理提交答案
submitButton.addEventListener('click', checkAnswer);