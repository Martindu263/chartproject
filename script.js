/**
 * 表单切换处理器类
 * 用于处理表单中的"是/否"、"有/无"等切换选项
 */
class FormToggleHandler {
    constructor() {
        // 存储所有切换配置
        this.toggleConfigs = [];
        // 初始化处理器
        this.init();
    }

    /**
     * 初始化方法
     */
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.toggleConfigs.forEach(config => this.createToggleHandler(config));
            this.setupFormValidation();
        });
    }

    /**
     * 添加新的切换配置
     * @param {Object} config - 切换配置对象
     * @returns {FormToggleHandler} - 返回实例本身，支持链式调用
     */
    addToggleConfig(config) {
        this.validateConfig(config);
        this.toggleConfigs.push(config);
        return this;
    }

    /**
     * 验证配置对象
     * @param {Object} config - 切换配置对象
     */
    validateConfig(config) {
        const requiredFields = ['positiveRadioId', 'negativeRadioId', 'inputSelector'];
        requiredFields.forEach(field => {
            if (!config[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        });
    }

    /**
     * 创建切换处理器
     * @param {Object} config - 切换配置对象
     */
    createToggleHandler(config) {
        const {
            positiveRadioId,    // "是"/"有"按钮ID
            negativeRadioId,    // "否"/"无"按钮ID
            inputSelector,      // 关联输入框的选择器
            positiveLabel = '是', // 默认"是"
            negativeLabel = '否'  // 默认"否"
        } = config;

        const elements = {
            positiveRadio: document.getElementById(positiveRadioId),
            negativeRadio: document.getElementById(negativeRadioId),
            inputs: document.querySelectorAll(inputSelector)
        };

        if (!this.validateElements(elements)) {
            console.warn(`Toggle elements not found for config: ${positiveRadioId}/${negativeRadioId}`);
            return;
        }

        this.setupToggleHandlers(elements);
        this.initializeState(elements);
    }

    /**
     * 验证DOM元素
     * @param {Object} elements - DOM元素对象
     * @returns {boolean} - 验证结果
     */
    validateElements(elements) {
        return elements.positiveRadio &&
               elements.negativeRadio &&
               elements.inputs.length > 0;
    }

    /**
     * 设置切换处理器
     * @param {Object} elements - DOM元素对象
     */
    setupToggleHandlers(elements) {
        const { positiveRadio, negativeRadio, inputs } = elements;

        const handlers = {
            disableInputs: () => {
                inputs.forEach(input => {
                    input.disabled = true;
                    input.classList.add('disabled');
                });
                positiveRadio.disabled = true;
            },

            enableInputs: () => {
                inputs.forEach(input => {
                    input.disabled = false;
                    input.classList.remove('disabled');
                });
                positiveRadio.disabled = false;
            },

            handleRadioClick: function(radio) {
                if (radio.checked && radio._wasChecked) {
                    radio.checked = false;
                    radio._wasChecked = false;
                    if (radio === negativeRadio) {
                        this.enableInputs();
                    }
                } else {
                    radio._wasChecked = radio.checked;
                    if (radio === negativeRadio && radio.checked) {
                        this.disableInputs();
                    }
                }
            }
        };

        [positiveRadio, negativeRadio].forEach(radio => {
            radio.addEventListener('click', () => {
                handlers.handleRadioClick.call(handlers, radio);
            });
        });
    }

    /**
     * 初始化状态
     * @param {Object} elements - DOM元素对象
     */
    initializeState(elements) {
        if (elements.negativeRadio.checked) {
            elements.inputs.forEach(input => {
                input.disabled = true;
                input.classList.add('disabled');
            });
            elements.positiveRadio.disabled = true;
        }
    }

    /**
     * 设置表单验证
     */
    setupFormValidation() {
        const numberInputs = document.querySelectorAll('input[type="text"][data-type="number"]');
        const phoneInputs = document.querySelectorAll('input[type="text"][data-type="phone"]');
        const emailInputs = document.querySelectorAll('input[type="text"][data-type="email"]');

        numberInputs.forEach(input => {
            input.addEventListener('input', this.validateNumber.bind(this));
        });

        phoneInputs.forEach(input => {
            input.addEventListener('input', this.validatePhone.bind(this));
        });

        emailInputs.forEach(input => {
            input.addEventListener('input', this.validateEmail.bind(this));
        });
    }

    /**
     * 验证数字输入
     * @param {Event} event - 输入事件
     */
    validateNumber(event) {
        const input = event.target;
        const value = input.value;
        if (!/^\d*$/.test(value)) {
            input.value = value.replace(/\D/g, '');
        }
    }

    /**
     * 验证电话号码
     * @param {Event} event - 输入事件
     */
    validatePhone(event) {
        const input = event.target;
        const value = input.value;
        if (!/^\d{0,11}$/.test(value)) {
            input.value = value.replace(/\D/g, '').slice(0, 11);
        }
    }

    /**
     * 验证邮箱地址
     * @param {Event} event - 输入事件
     */
    validateEmail(event) {
        const input = event.target;
        const value = input.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (value && !emailRegex.test(value)) {
            this.showError(input, '请输入有效的邮箱地址');
        } else {
            this.clearError(input);
        }
    }

    /**
     * 显示错误信息
     * @param {HTMLElement} input - 输入元素
     * @param {string} message - 错误信息
     */
    showError(input, message) {
        let errorDiv = input.nextElementSibling;
        if (!errorDiv || !errorDiv.classList.contains('error-message')) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
        }
        errorDiv.textContent = message;
        input.classList.add('invalid');
    }

    /**
     * 清除错误信息
     * @param {HTMLElement} input - 输入元素
     */
    clearError(input) {
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('error-message')) {
            errorDiv.remove();
        }
        input.classList.remove('invalid');
    }
}

// 创建全局实例
const formHandler = new FormToggleHandler();

// 添加所有需要的切换配置
formHandler
    .addToggleConfig({
        positiveRadioId: 'hasAgent',
        negativeRadioId: 'noAgent',
        inputSelector: '.agent-input',
        positiveLabel: '有',
        negativeLabel: '无'
    })
    .addToggleConfig({
        positiveRadioId: 'acceptElectronic',
        negativeRadioId: 'rejectElectronic',
        inputSelector: '.delivery-input',
        positiveLabel: '是',
        negativeLabel: '否'
    });

// 提供全局接口用于添加新的切换配置
window.addToggleConfig = function(config) {
    formHandler.addToggleConfig(config);
};

// 日期格式化工具函数
function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

// 设置当前日期
document.addEventListener('DOMContentLoaded', function() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date();
    const formattedDate = formatDate(today);

    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = formattedDate;
        }
    });
});

// 导出工具函数（如果需要）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FormToggleHandler,
        formatDate
    };
}