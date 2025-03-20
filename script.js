/**
 * FormHandler 类 - 处理表单的所有交互逻辑
 */
class FormHandler {
    /**
     * 构造函数 - 初始化表单处理器
     */
    constructor() {
        this.toggleConfigs = new Map();
        this.init();
    }

    /**
     * 初始化方法
     */
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupAllToggleGroups();
            this.setupFormValidation();
            this.setupCellValidation();
            this.initializeDateFields();
            this.setupCurrentDateTime();
        });
    }

    /**
     * 设置当前日期时间
     */
    setupCurrentDateTime() {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        const currentDate = new Date().toISOString().split('T')[0];

        dateInputs.forEach(input => {
            if (!input.value) {
                input.value = currentDate;
            }
        });
    }

    /**
     * 添加新的互斥选择配置
     */
    addToggleConfig(groupName, config) {
        if (!this.validateConfig(config)) {
            console.error(`Invalid config for group: ${groupName}`);
            return this;
        }
        this.toggleConfigs.set(groupName, {
            ...config,
            dependentGroups: config.dependentGroups || [],
            validationRules: config.validationRules || {}
        });
        return this;
    }

    /**
     * 验证配置对象
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
     */
    setupToggleGroup(groupName, config) {
        const positiveRadio = document.getElementById(config.positiveRadioId);
        const negativeRadio = document.getElementById(config.negativeRadioId);
        const inputs = document.querySelectorAll(config.inputSelector);

        if (!positiveRadio || !negativeRadio) {
            console.warn(`Toggle elements not found for group: ${groupName}`);
            return;
        }

        this.setupToggleHandlers(positiveRadio, negativeRadio, inputs, config);
        this.initializeGroupState(negativeRadio, inputs);
    }

    /**
     * 设置互斥选择处理器
     */
    setupToggleHandlers(positiveRadio, negativeRadio, inputs, config) {
        const handleRadioClick = (clickedRadio, otherRadio) => {
            if (clickedRadio.checked) {
                otherRadio.checked = false;

                if (clickedRadio === negativeRadio) {
                    this.disableElementGroup(inputs);
                } else {
                    this.enableElementGroup(inputs);
                }

                // 触发单元格验证
                this.validateCell(clickedRadio.closest('.cell-content'));
            }
        };

        positiveRadio.addEventListener('click', () => handleRadioClick(positiveRadio, negativeRadio));
        negativeRadio.addEventListener('click', () => handleRadioClick(negativeRadio, positiveRadio));
    }

    /**
     * 禁用元素组
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
     */
    enableElementGroup(elements) {
        elements.forEach(element => {
            element.disabled = false;
            element.classList.remove('disabled');
        });
    }

    /**
     * 初始化组状态
     */
    initializeGroupState(negativeRadio, inputs) {
        if (negativeRadio.checked) {
            this.disableElementGroup(inputs);
        }
    }

    /**
     * 设置表单验证
     */
    setupFormValidation() {
        // 设置输入验证
        const validationTypes = {
            'phone': value => /^[\d-]*$/.test(value),
            'email': value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            'number': value => /^\d*$/.test(value)
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
     * 设置单元格验证
     */
    setupCellValidation() {
        const cells = document.querySelectorAll('.cell-content');

        cells.forEach(cell => {
            const inputs = cell.querySelectorAll('input[type="text"], input[type="date"], select');
            const radios = cell.querySelectorAll('input[type="radio"]');

            // 初始验证
            this.validateCell(cell);

            // 监听输入变化
            inputs.forEach(input => {
                input.addEventListener('input', () => this.validateCell(cell));
                input.addEventListener('change', () => this.validateCell(cell));
            });

            // 监听单选按钮变化
            radios.forEach(radio => {
                radio.addEventListener('change', () => this.validateCell(cell));
            });
        });
    }

    /**
     * 验证单元格
     */
    validateCell(cell) {
        if (!cell) return;

        const inputs = cell.querySelectorAll('input[type="text"], input[type="date"], select');
        const radios = cell.querySelectorAll('input[type="radio"]');

        // 检查是否有"否"或"无"被选中
        const negativeChecked = Array.from(radios).some(radio =>
            (radio.id === 'noAgent' || radio.id === 'rejectElectronic') && radio.checked
        );

        // 如果选择了"否"或"无"，则认为该单元格已完成
        if (negativeChecked) {
            cell.classList.remove('incomplete');
            return;
        }

        // 检查所有输入框是否都已填写
        const allFilled = Array.from(inputs).every(input => {
            // 如果输入框被禁用，则不检查
            if (input.disabled) return true;
            // 检查是否有值
            return input.value.trim() !== '';
        });

        // 检查相关单选按钮是否已选择
        const radioGroupsComplete = this.checkRadioGroups(cell);

        // 更新单元格状态
        if (allFilled && radioGroupsComplete) {
            cell.classList.remove('incomplete');
        } else {
            cell.classList.add('incomplete');
        }
    }

    /**
     * 检查单选按钮组
     */
    checkRadioGroups(cell) {
        const radioGroups = cell.querySelectorAll('.custom-radio-group');

        return Array.from(radioGroups).every(group => {
            const radios = group.querySelectorAll('input[type="radio"]');
            // 检查组内是否有选中的单选按钮
            return Array.from(radios).some(radio => radio.checked);
        });
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

// 添加配置
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