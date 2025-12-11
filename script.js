/**
 * 問卷表單提交系統
 * 使用原生 JavaScript (ES6+) 和 Fetch API
 * 
 * 重要：請將下方的 GAS_WEB_APP_URL 替換為您的 Google Apps Script Web App URL
 */
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyHbeaDPOHQzdRFQErbg8wgaaG_cuP8mo0OKej0Kqd-G-r8xjPAAc8x3w29hp4SMMKQ/exec';

/**
 * DOM 元素引用
 */
const form = document.getElementById('surveyForm');
const submitBtn = document.getElementById('submitBtn');
const btnLoader = document.getElementById('btnLoader');
const messageContainer = document.getElementById('messageContainer');

/**
 * 表單欄位驗證規則
 */
const validationRules = {
    name: {
        required: true,
        validate: (value) => value.trim().length >= 2,
        message: '姓名至少需要 2 個字元'
    },
    email: {
        required: true,
        validate: (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value.trim());
        },
        message: '請輸入有效的電子郵件地址'
    },
    food: {
        required: true,
        validate: (value) => value !== '',
        message: '請選擇飲食滿意度'
    },
    drink: {
        required: true,
        validate: (value) => value !== '',
        message: '請選擇飲水習慣滿意度'
    },
    stay: {
        required: true,
        validate: (value) => value !== '',
        message: '請選擇居住環境滿意度'
    },
    travel: {
        required: true,
        validate: (value) => value !== '',
        message: '請選擇旅行頻率滿意度'
    }
};

/**
 * 顯示錯誤訊息
 * @param {string} fieldName - 欄位名稱
 * @param {string} message - 錯誤訊息
 */
function showError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
    
    const inputElement = document.querySelector(`[name="${fieldName}"]`);
    if (inputElement) {
        inputElement.style.borderColor = 'var(--color-error)';
    }
}

/**
 * 清除錯誤訊息
 * @param {string} fieldName - 欄位名稱
 */
function clearError(fieldName) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
    
    const inputElement = document.querySelector(`[name="${fieldName}"]`);
    if (inputElement) {
        inputElement.style.borderColor = '';
    }
}

/**
 * 驗證單一欄位
 * @param {string} fieldName - 欄位名稱
 * @param {string} value - 欄位值
 * @returns {boolean} - 驗證是否通過
 */
function validateField(fieldName, value) {
    const rule = validationRules[fieldName];
    
    if (!rule) {
        return true; // 沒有驗證規則的欄位視為通過
    }
    
    // 檢查必填欄位
    if (rule.required && (!value || value.trim() === '')) {
        showError(fieldName, `${fieldName === 'name' ? '姓名' : fieldName === 'email' ? '電子郵件' : '此欄位'}為必填項目`);
        return false;
    }
    
    // 如果欄位為空且非必填，則通過驗證
    if (!rule.required && (!value || value.trim() === '')) {
        clearError(fieldName);
        return true;
    }
    
    // 執行自訂驗證規則
    if (!rule.validate(value)) {
        showError(fieldName, rule.message);
        return false;
    }
    
    clearError(fieldName);
    return true;
}

/**
 * 驗證整個表單
 * @returns {boolean} - 表單驗證是否通過
 */
function validateForm() {
    let isValid = true;
    const formData = new FormData(form);
    
    // 驗證所有有規則的欄位
    Object.keys(validationRules).forEach(fieldName => {
        const value = formData.get(fieldName);
        if (!validateField(fieldName, value)) {
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * 收集表單數據並轉換為 JSON 格式
 * @returns {Object} - 符合要求的 JSON 數據物件
 * 注意：欄位名稱必須與 Google 表單欄位名稱精確匹配（首字母大寫）
 */
function collectFormData() {
    const formData = new FormData(form);
    const data = {};
    
    // 欄位映射：表單欄位名稱 -> JSON Key 名稱（必須與 Google 表單欄位名稱匹配）
    const fieldMapping = {
        'name': 'Name',
        'email': 'Email',
        'gender': 'Gender',
        'age': 'Age',
        'transportation': 'transportation',
        'interest': 'Interest',
        'feedback': 'Feedback',
        'food': 'food',
        'drink': 'drink',
        'stay': 'stay',
        'travel': 'travel'
    };
    
    // 收集所有表單欄位並轉換為正確的 Key 名稱
    Object.keys(fieldMapping).forEach(formField => {
        const jsonKey = fieldMapping[formField];
        const value = formData.get(formField);
        
        // 處理空值：非必填欄位如果為空則設為空字串
        if (value === null || value === '') {
            data[jsonKey] = '';
        } else {
            // 數字欄位轉換
            if (formField === 'age') {
                data[jsonKey] = value ? parseInt(value, 10) : '';
            } else if (['food', 'drink', 'stay', 'travel'].includes(formField)) {
                data[jsonKey] = value ? parseInt(value, 10) : '';
            } else {
                data[jsonKey] = value.trim();
            }
        }
    });
    
    // 添加時間戳（ISO 8601 格式）
    data.timestamp = new Date().toISOString();
    
    return data;
}

/**
 * 顯示訊息給使用者
 * @param {string} message - 訊息內容
 * @param {string} type - 訊息類型 ('success' 或 'error')
 */
function showMessage(message, type = 'success') {
    messageContainer.innerHTML = `<div class="message ${type}">${message}</div>`;
    
    // 3 秒後自動清除成功訊息
    if (type === 'success') {
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }
}

/**
 * 設定提交按鈕狀態
 * @param {boolean} isLoading - 是否正在載入
 */
function setSubmitButtonState(isLoading) {
    if (isLoading) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
    } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
}

/**
 * 重置表單
 */
function resetForm() {
    form.reset();
    // 清除所有錯誤訊息
    Object.keys(validationRules).forEach(fieldName => {
        clearError(fieldName);
    });
}

/**
 * 提交表單數據到 Google Apps Script
 * @param {Object} data - 要提交的數據
 */
async function submitFormData(data) {
    // 檢查 GAS URL 是否已設定
    if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        throw new Error('請先設定 Google Apps Script Web App URL');
    }
    
    console.log('準備提交數據:', data);
    console.log('目標 URL:', GAS_WEB_APP_URL);
    
    // 使用 Google Apps Script 推薦的方式：直接 POST，不檢查 CORS
    // 這需要部署設定中「具有存取權的使用者」設為「任何人」
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // 使用異步請求
        xhr.open('POST', GAS_WEB_APP_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        // 處理回應
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                // 無論狀態碼如何，都嘗試處理
                try {
                    if (xhr.responseText && xhr.responseText.trim()) {
                        const result = JSON.parse(xhr.responseText);
                        console.log('收到回應:', result);
                        resolve(result);
                    } else {
                        // 沒有回應內容，但請求可能已成功
                        console.log('無回應內容，假設請求成功');
                        resolve({ success: true });
                    }
                } catch (parseError) {
                    // 無法解析回應，但請求可能已成功
                    console.log('無法解析回應，但請求可能已成功');
                    resolve({ success: true });
                }
            }
        };
        
        // 處理錯誤
        xhr.onerror = function() {
            console.error('XHR 錯誤');
            reject(new Error('無法連接到伺服器。請確認：\n1) Google Apps Script 部署設定中「具有存取權的使用者」已設為「任何人」\n2) 網路連線正常\n3) Web App URL 正確'));
        };
        
        // 處理超時
        xhr.ontimeout = function() {
            console.error('請求超時');
            reject(new Error('請求超時，請稍後再試'));
        };
        
        xhr.timeout = 30000;
        
        // 發送請求
        try {
            console.log('發送請求...');
            xhr.send(JSON.stringify(data));
        } catch (sendError) {
            console.error('發送請求時發生錯誤:', sendError);
            reject(new Error('無法發送請求: ' + sendError.message));
        }
    });
}

/**
 * 處理表單提交
 * @param {Event} event - 表單提交事件
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // 清除之前的訊息
    messageContainer.innerHTML = '';
    
    // 驗證表單
    if (!validateForm()) {
        showMessage('請檢查並修正表單中的錯誤', 'error');
        // 滾動到第一個錯誤欄位
        const firstError = document.querySelector('.error-message.show');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    
    // 收集表單數據
    const formData = collectFormData();
    
    // 顯示載入狀態
    setSubmitButtonState(true);
    
    try {
        // 提交數據
        await submitFormData(formData);
        
        // 顯示成功訊息
        showMessage('問卷提交成功！感謝您的參與。', 'success');
        
        // 重置表單
        setTimeout(() => {
            resetForm();
        }, 2000);
        
    } catch (error) {
        // 顯示錯誤訊息
        showMessage(error.message || '提交失敗，請稍後再試', 'error');
        console.error('表單提交錯誤:', error);
    } finally {
        // 恢復按鈕狀態
        setSubmitButtonState(false);
    }
}

/**
 * 即時驗證（當使用者離開欄位時）
 */
function setupRealTimeValidation() {
    // 為所有輸入欄位添加 blur 事件監聽器
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            const fieldName = input.name;
            if (validationRules[fieldName]) {
                validateField(fieldName, input.value);
            }
        });
        
        // 清除錯誤樣式當使用者開始輸入時
        input.addEventListener('input', () => {
            const fieldName = input.name;
            if (input.style.borderColor === 'var(--color-error)' || 
                input.style.borderColor === 'rgb(204, 0, 0)') {
                clearError(fieldName);
            }
        });
    });
    
    // 為單選按鈕添加 change 事件監聽器
    const radioGroups = ['food', 'drink', 'stay', 'travel'];
    radioGroups.forEach(groupName => {
        const radios = form.querySelectorAll(`input[name="${groupName}"]`);
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                clearError(groupName);
            });
        });
    });
}

/**
 * 初始化應用程式
 */
function init() {
    // 檢查 GAS URL 是否已設定
    if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
        console.warn('警告：請在 script.js 中設定 GAS_WEB_APP_URL');
        showMessage('系統配置未完成，請聯繫管理員', 'error');
    }
    
    // 綁定表單提交事件
    form.addEventListener('submit', handleFormSubmit);
    
    // 設定即時驗證
    setupRealTimeValidation();
    
    console.log('問卷表單系統已初始化');
}

// 當 DOM 載入完成時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

