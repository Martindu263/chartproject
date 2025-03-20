/**
 * FormHandler 类 - 处理表单的所有交互逻辑
 * 处理表单中的选择、验证、状态管理等功能
 */
class FormHandler {
    /**
     * 构造函数 - 初始化表单处理器
     */
    constructor() {
        // 存储所有互斥选择配置
        this.toggleConfigs = new Map();
        // 初始化处理器
        this.init();
    }

    /**
     * 初始化方法
     * 在DOM加载完成后设置所有必要的处理器和监听器
     */
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupAllToggleGroups();
            this.setupFormValidation();
            this.addCompletionIndicators();
            this.setupInputValidation();
            this.initializeDateFields();
        });
    }

    /**
     * 添加新的互斥选择配置
     * @param {String} groupName - 互斥组的唯一标识名
     * @param {Object} config - 配置对象
     * @returns {FormHandler} - 返回实例本身，支持链式调用
     */
    addToggleConfig(groupName, config) {
        if (!this.validateConfig(config)) {
            console.error(`Invalid config for group: ${groupName}`);
            return this;
        }
        this.toggleConfigs.set(groupName, {
            ...config,
            // 扩展配置，添加默认值
            dependentGroups: config.dependentGroups || [],
            validationRules: config.validationRules || {}
        });
        return this;
    }

    /**
     * 验证配置对象
     * @param {Object} config - 配置对象
     * @returns {Boolean} - 验证结果
     */
    validateConfig(config) {
        const requiredFields = ['positiveRadioId', 'negativeRadioId', 'inputSelector'];
        return requiredFields.every(field => config[field]);
    }

    /**
     * 设置所有互斥选择组
     */
    setupAllToggleGroups() {
        this.toggleConfigs.forEach((config, groupName) => {
            this.setupToggleGroup(groupName, config);
        });
    }

    /**
     * 设置单个互斥选择组
     * @param {String} groupName - 组名
     * @param {Object} config - 配置对象
     */
    setupToggleGroup(groupName, config) {
        const elements = {
            positiveRadio: document.getElementById(config.positiveRadioId),
            negativeRadio: document.getElementById(config.negativeRadioId),
            inputs: document.querySelectorAll(config.inputSelector)
        };

        if (!this.validateElements(elements)) {
            console.warn(`Toggle elements not found for group: ${groupName}`);
            return;
        }

        this.setupToggleHandlers(groupName, elements, config);
        this.initializeGroupState(elements, config);
    }

    /**
     * 验证DOM元素
     * @param {Object} elements - DOM元素对象
     * @returns {Boolean} - 验证结果
     */
    validateElements(elements) {
        return elements.positiveRadio &&
               elements.negativeRadio &&
               elements.inputs.length > 0;
    }

    /**
     * 设置互斥选择处理器
     * @param {String} groupName - 组名
     * @param {Object} elements - DOM元素对象
     * @param {Object} config - 配置对象
     */
    setupToggleHandlers(groupName, elements, config) {
        const { positiveRadio, negativeRadio, inputs } = elements;

        const handlers = {
            /**
             * 禁用输入字段
             */
            disableInputs: () => {
                this.disableElementGroup(inputs);
                if (config.dependentGroups) {
                    this.handleDependentGroups(config.dependentGroups, true);
                }
            },

            /**
             * 启用输入字段
             */
            enableInputs: () => {
                this.enableElementGroup(inputs);
                if (config.dependentGroups) {
                    this.handleDependentGroups(config.dependentGroups, false);
                }
            },

            /**
             * 处理单选按钮点击
             * @param {HTMLElement} clickedRadio - 被点击的单选按钮
             * @param {HTMLElement} otherRadio - 另一个单选按钮
             */
            handleRadioClick: (clickedRadio, otherRadio) => {
                if (clickedRadio.checked) {
                    otherRadio.checked = false;

                    if (clickedRadio === negativeRadio) {
                        handlers.disableInputs();
                    } else {
                        handlers.enableInputs();
                    }

                    this.updateGroupCompletionStatus(groupName);
                }
            }
        };

        // 设置点击事件监听器
        positiveRadio.addEventListener('click', () => {
            handlers.handleRadioClick(positiveRadio, negativeRadio);
        });

        negativeRadio.addEventListener('click', () => {
            handlers.handleRadioClick(negativeRadio, positiveRadio);
        });
    }

    /**
     * 禁用元素组
     * @param {NodeList} elements - 要禁用的元素集合
     */
    disableElementGroup(elements) {
        elements.forEach(element => {
            element.disabled = true;
            element.value = '';
            element.classList.add('disabled');
            if (element.type === 'radio' || element.type === 'checkbox') {
                element.checked = false;
            }
        });
    }

    /**
     * 启用元素组
     * @param {NodeList} elements - 要启用的元素集合
     */
    enableElementGroup(elements) {
        elements.forEach(element => {
            element.disabled = false;
            element.classList.remove('disabled');
        });
    }

    /**
     * 处理依赖组
     * @param {Array} dependentGroups - 依赖组配置数组
     * @param {Boolean} disable - 是否禁用
     */
    handleDependentGroups(dependentGroups, disable) {
        dependentGroups.forEach(groupName => {
            const config = this.toggleConfigs.get(groupName);
            if (config) {
                const elements = document.querySelectorAll(config.inputSelector);
                if (disable) {
                    this.disableElementGroup(elements);
                } else {
                    this.enableElementGroup(elements);
                }
            }
        });
    }

    /**
     * 初始化组状态
     * @param {Object} elements - DOM元素对象
     * @param {Object} config - 配置对象
     */
    initializeGroupState(elements, config) {
        if (elements.negativeRadio.checked) {
            this.disableElementGroup(elements.inputs);
            if (config.dependentGroups) {
                this.handleDependentGroups(config.dependentGroups, true);
            }
        }
    }

    /**
     * 设置表单验证
     */
    setupFormValidation() {
        // 设置不同类型输入的验证
        const validationTypes = {
            'phone': (value) => /^[\d-]*$/.test(value),
            'number': (value) => /^\d*$/.test(value),
            'email': (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        };

        Object.entries(validationTypes).forEach(([type, validator]) => {
            const inputs = document.querySelectorAll(`input[data-type="${type}"]`);
            inputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    const value = e.target.value;
                    if (!validator(value)) {
                        e.target.value = type === 'phone' ? value.replace(/[^\d-]/g, '')
                                     : type === 'number' ? value.replace(/\D/g, '')
                                     : value;
                    }
                });
            });
        });
    }

    /**
     * 添加完成状态指示器
     */
    addCompletionIndicators() {
        document.querySelectorAll('.cell-content').forEach(cell => {
            if (!cell.querySelector('.completion-indicator')) {
                const indicator = document.createElement('span');
                indicator.className = 'completion-indicator';
                cell.appendChild(indicator);
            }
        });
    }

    /**
     * 更新组完成状态
     * @param {String} groupName - 组名
     */
    updateGroupCompletionStatus(groupName) {
        const config = this.toggleConfigs.get(groupName);
        if (!config) return;

        const elements = {
            cell: document.getElementById(config.positiveRadioId).closest('.cell-content'),
            inputs: document.querySelectorAll(config.inputSelector),
            negativeRadio: document.getElementById(config.negativeRadioId)
        };

        const indicator = elements.cell.querySelector('.completion-indicator');
        let isComplete = elements.negativeRadio.checked;

        if (!isComplete) {
            isComplete = Array.from(elements.inputs).every(input => {
                if (input.disabled) return true;
                if (input.type === 'radio' || input.type === 'checkbox') {
                    return !input.required || input.checked;
                }
                return !input.required || input.value.trim() !== '';
            });
        }

        this.updateCompletionIndicator(indicator, isComplete);
    }

    /**
     * 更新完成指示器
     * @param {HTMLElement} indicator - 指示器元素
     * @param {Boolean} isComplete - 是否完成
     */
    updateCompletionIndicator(indicator, isComplete) {
        if (isComplete) {
            indicator.classList.add('complete');
            indicator.textContent = '✓';
        } else {
            indicator.classList.remove('complete');
            indicator.textContent = '';
        }
    }

    /**
     * 初始化日期字段
     */
    initializeDateFields() {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        const today = new Date().toISOString().split('T')[0];

        dateInputs.forEach(input => {
            if (!input.value) {
                input.value = today;
            }
        });
    }
}

// 创建表单处理器实例
const formHandler = new FormHandler();

// 添加配置示例
formHandler
    .addToggleConfig('agentGroup', {
        positiveRadioId: 'hasAgent',
        negativeRadioId: 'noAgent',
        inputSelector: '.agent-input'
    })
    .addToggleConfig('electronicDeliveryGroup', {
        positiveRadioId: 'acceptElectronic',
        negativeRadioId: 'rejectElectronic',
        inputSelector: '.electronic-delivery-input'
    });

// 提供全局接口
window.FormHandler = FormHandler;
window.formHandler = formHandler;