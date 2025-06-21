// timu.js

// 定义题库文件路径
const quizFiles = {
    xz: 'xz.json',
    tk: 'tk.json',
    pd: 'pd.json'
};

// 初始化变量
let currentQuiz = null;
let currentQuestionIndex = 0;
let answeredCount = 0;
let score = 0;
let selectedQuizzes = {};
let wrongAnswers = [];
let currentQuizType = null;
let preparationTime = 3; // 准备时间（秒）

// 获取DOM元素
const questionContainer = document.getElementById('question-container');
const submitButton = document.getElementById('submit-answer-button');
const nextPageButton = document.getElementById('next-page-button');
const resultContainer = document.getElementById('result-container');
const finalScoreElement = document.getElementById('final-score');
const accuracyElement = document.getElementById('accuracy');
const wrongQuestionsContainer = document.getElementById('wrong-questions');
const progressElement = document.getElementById('progress');
const currentQuizTypeElement = document.getElementById('current-quiz-type');
const answeredCountElement = document.getElementById('answered-count');
const scoreElement = document.getElementById('score');
const readyPage = document.getElementById('ready-page');
const readyTitle = document.getElementById('ready-title');
const countdownElement = document.getElementById('countdown');
const startQuizButton = document.getElementById('start-quiz-button');
const selectXZButton = document.getElementById('select-xz');
const selectTKButton = document.getElementById('select-tk');
const selectPDButton = document.getElementById('select-pd');

// 题型配置
const quizConfig = {
    xz: { name: "选择题", count: 20, scorePerQuestion: 2 },
    tk: { name: "填空题", count: 20, scorePerQuestion: 2 },
    pd: { name: "判断题", count: 10, scorePerQuestion: 2 }
};

// 加载题库
function loadQuiz(quizType) {
    // 清空之前的题目
    questionContainer.innerHTML = '';
    resultContainer.style.display = 'none';
    nextPageButton.style.display = 'none';
    answeredCount = 0;
    currentQuestionIndex = 0;
    currentQuizType = quizType;
    
    // 显示准备页面
    showPreparationPage(quizType);
}

// 显示准备页面
function showPreparationPage(quizType) {
    // 设置准备标题和倒计时
    readyTitle.textContent = `开始做${quizConfig[quizType].name}`;
    countdownElement.textContent = `准备时间：${preparationTime}秒`;
    
    // 显示准备页面
    readyPage.style.display = 'block';
    readyPage.classList.add('fade-in');
    
    // 开始倒计时
    const countdownInterval = setInterval(() => {
        preparationTime--;
        countdownElement.textContent = `准备时间：${preparationTime}秒`;
        
        if (preparationTime <= 0) {
            clearInterval(countdownInterval);
            startQuizButton.style.display = 'inline-block';
            countdownElement.style.display = 'none';
        }
    }, 1000);
}

// 开始答题
function startQuiz() {
    // 隐藏准备页面
    readyPage.style.display = 'none';
    
    // 重置准备时间
    preparationTime = 3;
    countdownElement.style.display = 'inline-block';
    
    // 如果已加载过该题型
    if (selectedQuizzes[currentQuizType] && selectedQuizzes[currentQuizType].questions.length > 0) {
        renderQuestion();
        updateProgress();
        return;
    }
    
    // 显示加载提示
    questionContainer.innerHTML = '<p>正在加载题库，请稍候...</p>';
    questionContainer.style.display = 'block';
    
    // 获取当前题库文件路径
    const quizPath = quizFiles[currentQuizType];
    console.log(`尝试加载题库: ${quizPath}`); // 添加调试信息
    
    // 第一次加载该题型
    fetch(quizPath)
        .then(response => {
            console.log(`收到响应: ${quizPath}`, response); // 添加调试信息
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            try {
                console.log(`成功解析JSON数据: ${quizPath}`, data); // 添加调试信息
                
                // 验证数据格式
                if (!Array.isArray(data)) {
                    throw new Error('题库数据不是数组');
                }
                
                // 随机选择指定数量的题目
                const quizCount = quizConfig[currentQuizType].count;
                const shuffled = [...data].sort(() => 0.5 - Math.random());
                const selectedQuestions = shuffled.slice(0, quizCount);
                
                // 初始化题型数据
                selectedQuizzes[currentQuizType] = {
                    questions: selectedQuestions,
                    answers: {},
                    completed: false
                };
                
                // 设置当前题库
                currentQuiz = selectedQuizzes[currentQuizType].questions;
                
                // 渲染题目
                renderQuestion();
                updateProgress();
            } catch (error) {
                console.error('处理题库数据时出错:', error);
                alert(`处理题库数据时出错: ${error.message}`);
            }
        })
        .catch(error => {
            console.error('加载题库时出错:', error);
            alert(`无法加载${quizConfig[currentQuizType].name}: ${error.message}\n请确保:\n1. 题库文件存在且路径正确\n2. 题库文件格式正确\n3. 没有浏览器安全限制（建议使用本地服务器运行）`);
            
            // 隐藏加载提示
            questionContainer.style.display = 'none';
            submitButton.style.display = 'none';
        });
}

// 渲染单个题目
function renderQuestion() {
    // 隐藏所有容器
    questionContainer.style.display = 'none';
    submitButton.style.display = 'none';
    
    // 检查是否有当前题库
    if (!currentQuiz || currentQuiz.length === 0) {
        alert('题库为空，请重新选择题型');
        return;
    }
    
    const question = currentQuiz[currentQuestionIndex];
    questionContainer.innerHTML = '';

    // 添加题目标题
    const questionTitle = document.createElement('h3');
    questionTitle.textContent = `${currentQuestionIndex + 1}. ${question.question}`;
    questionContainer.appendChild(questionTitle);
    
    // 根据题型添加不同内容
    if (currentQuizType === 'xz') {
        // 选择题
        const optionsList = document.createElement('ul');
        question.options.forEach((option, index) => {
            const optionItem = document.createElement('li');
            
            // 创建单选按钮
            const optionInput = document.createElement('input');
            optionInput.type = 'radio';
            optionInput.name = `answer-${currentQuestionIndex}`;
            optionInput.value = index.toString();
            
            // 如果已回答过，设置为已选中
            if (selectedQuizzes[currentQuizType].answers[currentQuestionIndex] !== undefined) {
                optionInput.checked = selectedQuizzes[currentQuizType].answers[currentQuestionIndex] === index;
            }
            
            // 添加事件监听器
            optionInput.addEventListener('change', () => {
                selectedQuizzes[currentQuizType].answers[currentQuestionIndex] = index;
            });
            
            // 创建标签
            const optionLabel = document.createElement('label');
            optionLabel.textContent = option;
            
            // 将元素添加到页面
            optionItem.appendChild(optionInput);
            optionItem.appendChild(optionLabel);
            optionsList.appendChild(optionItem);
        });
        questionContainer.appendChild(optionsList);
    } else if (currentQuizType === 'tk') {
        // 填空题
        const answerInput = document.createElement('input');
        answerInput.type = 'text';
        answerInput.className = 'blank-input';
        answerInput.placeholder = '请输入答案';
        
        // 如果已回答过，设置值
        if (selectedQuizzes[currentQuizType].answers[currentQuestionIndex] !== undefined) {
            answerInput.value = selectedQuizzes[currentQuizType].answers[currentQuestionIndex];
        }
        
        // 添加事件监听器
        answerInput.addEventListener('input', () => {
            selectedQuizzes[currentQuizType].answers[currentQuestionIndex] = answerInput.value;
        });
        
        // 创建包装元素
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'blank-wrapper';
        inputWrapper.appendChild(answerInput);
        
        // 将元素添加到页面
        questionContainer.appendChild(inputWrapper);
    } else if (currentQuizType === 'pd') {
        // 判断题
        const optionsList = document.createElement('ul');
        const options = ['正确', '错误'];
        
        options.forEach((option, index) => {
            const optionItem = document.createElement('li');
            
            // 创建单选按钮
            const optionInput = document.createElement('input');
            optionInput.type = 'radio';
            optionInput.name = `answer-${currentQuestionIndex}`;
            optionInput.value = index.toString();
            
            // 如果已回答过，设置为已选中
            if (selectedQuizzes[currentQuizType].answers[currentQuestionIndex] !== undefined) {
                optionInput.checked = selectedQuizzes[currentQuizType].answers[currentQuestionIndex] === index;
            }
            
            // 添加事件监听器
            optionInput.addEventListener('change', () => {
                selectedQuizzes[currentQuizType].answers[currentQuestionIndex] = index;
            });
            
            // 创建标签
            const optionLabel = document.createElement('label');
            optionLabel.textContent = option;
            
            // 将元素添加到页面
            optionItem.appendChild(optionInput);
            optionItem.appendChild(optionLabel);
            optionsList.appendChild(optionItem);
        });
        
        questionContainer.appendChild(optionsList);
    }
    
    // 更新统计信息
    updateStats();
    
    // 显示题目和提交按钮
    questionContainer.style.display = 'block';
    submitButton.style.display = 'inline-block';
}

// 提交答案
function submitAnswers() {
    const quizType = currentQuizType;
    
    if (!quizType) return;
    
    // 清空错题记录
    wrongAnswers = [];
    
    // 计算得分
    let correctCount = 0;
    
    for (let i = 0; i < currentQuiz.length; i++) {
        const question = currentQuiz[i];
        let userAnswer = selectedQuizzes[quizType].answers[i];
        let isCorrect = false;
        
        if (quizType === 'xz') {
            // 选择题
            isCorrect = userAnswer === question.answer.charCodeAt(0) - 65;
        } else if (quizType === 'tk') {
            // 填空题
            isCorrect = userAnswer && userAnswer.toLowerCase() === question.answer.toLowerCase();
        } else if (quizType === 'pd') {
            // 判断题
            isCorrect = (userAnswer === 0 && question.answer === '正确') || 
                        (userAnswer === 1 && question.answer === '错误');
        }
        
        if (isCorrect) {
            correctCount++;
        } else {
            // 记录错题
            wrongAnswers.push({
                question: question,
                userAnswer: userAnswer,
                quizType: quizType
            });
        }
    }
    
    // 计算得分
    const quizConfigItem = quizConfig[quizType];
    score = correctCount * quizConfigItem.scorePerQuestion;
    
    // 更新完成状态
    selectedQuizzes[quizType].completed = true;
    
    // 显示结果
    showResults(correctCount, currentQuiz.length, quizConfigItem.scorePerQuestion);
}

// 显示结果
function showResults(correctCount, totalCount, scorePerQuestion) {
    // 隐藏题目和提交按钮
    questionContainer.style.display = 'none';
    submitButton.style.display = 'none';
    
    // 显示下一题型按钮或完成结果
    const quizKeys = Object.keys(quizConfig);
    const currentIndex = quizKeys.indexOf(currentQuizType);
    
    if (currentIndex < quizKeys.length - 1) {
        // 还有下一个题型
        nextPageButton.style.display = 'inline-block';
    } else {
        // 所有题型完成，显示最终结果
        resultContainer.style.display = 'block';
        finalScoreElement.textContent = calculateTotalScore();
        accuracyElement.textContent = ((correctCount / totalCount) * 100).toFixed(2) + '%';
        displayWrongQuestions();
    }
    
    // 更新进度条
    updateProgress();
}

// 处理开始选择题
document.getElementById('select-xz').addEventListener('click', () => {
    loadQuiz('xz');
});

// 处理开始填空题
document.getElementById('select-tk').addEventListener('click', () => {
    loadQuiz('tk');
});

// 处理开始判断题
document.getElementById('select-pd').addEventListener('click', () => {
    loadQuiz('pd');
});

// 处理开始答题按钮
document.getElementById('start-quiz-button').addEventListener('click', startQuiz);

// 处理提交答案
submitButton.addEventListener('click', submitAnswers);

// 处理下一题型按钮
nextPageButton.addEventListener('click', () => {
    const quizKeys = Object.keys(quizConfig);
    const currentIndex = quizKeys.indexOf(currentQuizType);
    
    if (currentIndex < quizKeys.length - 1) {
        // 加载下一个题型
        loadQuiz(quizKeys[currentIndex + 1]);
    }
});
