/**
 * FormHandler 类 - 处理表单的所有交互逻辑
 */
class FormHandler {
    /**
     * 构造函数 - 初始化表单处理器
     */
    constructor() {
        this.toggleConfigs = new Map();
        this.lockedSections = new Set();
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
            this.initializeDateGroups();
            this.initializeLockableContent();
            // 保存初始状态
            this.saveFormState();
        });
    }

    /**
     * 初始化日期组
     */
    initializeDateGroups() {
        const dateGroups = document.querySelectorAll('.date-group');

        dateGroups.forEach(group => {
            const yearSelect = group.querySelector('[data-type="year"]');
            const monthSelect = group.querySelector('[data-type="month"]');
            const daySelect = group.querySelector('[data-type="day"]');

            if (yearSelect && monthSelect && daySelect) {
                // 初始化年份选择器
                this.initializeYearSelect(yearSelect);
                // 初始化月份选择器
                this.initializeMonthSelect(monthSelect);
                // 初始化日期选择器
                this.initializeDaySelect(daySelect, yearSelect, monthSelect);

                // 添加联动事件
                yearSelect.addEventListener('change', () => {
                    this.updateDayOptions(daySelect, yearSelect, monthSelect);
                });
                monthSelect.addEventListener('change', () => {
                    this.updateDayOptions(daySelect, yearSelect, monthSelect);
                });
            }
        });
    }

    /**
     * 初始化年份选择器
     * @param {HTMLSelectElement} yearSelect - 年份选择元素
     */
    initializeYearSelect(yearSelect) {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 120; // 假设最大年龄为120岁

        yearSelect.innerHTML = ''; // 清空现有选项

        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '请选择';
        yearSelect.appendChild(defaultOption);

        // 添加年份选项
        for (let year = currentYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        }
    }

     /**
     * 初始化月份选择器
     * @param {HTMLSelectElement} monthSelect - 月份选择元素
     */
    initializeMonthSelect(monthSelect) {
        monthSelect.innerHTML = ''; // 清空现有选项

        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '请选择';
        monthSelect.appendChild(defaultOption);

        // 添加月份选项（1-12月）
        for (let month = 1; month <= 12; month++) {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = month;
            monthSelect.appendChild(option);
        }
    }

    /**
     * 初始化日期选择器
     * @param {HTMLSelectElement} daySelect - 日期选择元素
     * @param {HTMLSelectElement} yearSelect - 年份选择元素
     * @param {HTMLSelectElement} monthSelect - 月份选择元素
     */
    initializeDaySelect(daySelect, yearSelect, monthSelect) {
        daySelect.innerHTML = ''; // 清空现有选项

        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '请选择';
        daySelect.appendChild(defaultOption);

        // 添加日期选项（1-31日）
        this.updateDayOptions(daySelect, yearSelect, monthSelect);
    }

    /**
     * 更新日期选项
     * @param {HTMLSelectElement} daySelect - 日期选择元素
     * @param {HTMLSelectElement} yearSelect - 年份选择元素
     * @param {HTMLSelectElement} monthSelect - 月份选择元素
     */
    updateDayOptions(daySelect, yearSelect, monthSelect) {
        const year = parseInt(yearSelect.value) || new Date().getFullYear();
        const month = parseInt(monthSelect.value) || 1;

        // 获取当月的天数
        const daysInMonth = new Date(year, month, 0).getDate();

        // 保存当前选中的值
        const currentValue = daySelect.value;

        daySelect.innerHTML = ''; // 清空现有选项

        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '请选择';
        daySelect.appendChild(defaultOption);

        // 添加日期选项
        for (let day = 1; day <= daysInMonth; day++) {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day;
            daySelect.appendChild(option);
        }

        // 如果之前选中的值仍然有效，则保持选中
        if (currentValue && currentValue <= daysInMonth) {
            daySelect.value = currentValue;
        }
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
            (radio.id === 'noAgent' ||
             radio.id === 'rejectElectronic' ||
             radio.id === 'noEarlyRepayment' ||
             radio.id === 'guaranteeNo' ||
             radio.id === 'debtCostNo' ||
             radio.id === 'jurisdictionNo' ||
             radio.id === 'isOverdueNo' ||
             radio.id === 'hasGuaranteeContractNo' ||
             radio.id === 'isMaxGuaranteeNo' ||
             radio.id === 'hasRegistrationNo' ||
             radio.id === 'hasWarrantyContractNo'||
             radio.id === 'hasOtherGuaranteeNo') && radio.checked
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

    /**
     * 初始化可锁定内容
     */
    initializeLockableContent() {
        const lockableContainers = document.querySelectorAll('.lockable-content');

        lockableContainers.forEach(container => {
            const textarea = container.querySelector('textarea');
            const lockButton = container.querySelector('.lock-button');
            const sectionId = container.dataset.section;

            if (textarea && lockButton && sectionId) {
                // 初始化状态
                container.classList.add('unlocked');

                // 设置自动保存
                textarea.addEventListener('input', () => {
                    this.autoSave(sectionId, textarea.value);
                });

                // 设置锁定按钮事件
                lockButton.addEventListener('click', () => {
                    this.toggleLockState(container);
                });

                // 恢复保存的状态
                this.restoreContent(sectionId, textarea);
            }
        });
    }

    /**
     * 切换锁定状态
     * @param {HTMLElement} container - 容器元素
     */
    toggleLockState(container) {
        const textarea = container.querySelector('textarea');
        const lockButton = container.querySelector('.lock-button');
        const sectionId = container.dataset.section;
        const isLocked = container.classList.contains('locked');

        if (isLocked) {
            this.unlockSection(container, textarea, lockButton);
            this.lockedSections.delete(sectionId);
        } else {
            if (this.validateContent(textarea)) {
                this.lockSection(container, textarea, lockButton);
                this.lockedSections.add(sectionId);
            }
        }

        // 保存状态
        this.saveFormState();
    }

    /**
     * 锁定区域
     * @param {HTMLElement} container - 容器元素
     * @param {HTMLTextAreaElement} textarea - 文本区域
     * @param {HTMLButtonElement} lockButton - 锁定按钮
     */
    lockSection(container, textarea, lockButton) {
        container.classList.remove('unlocked');
        container.classList.add('locked');
        textarea.readOnly = true;
        lockButton.querySelector('.lock-icon').textContent = '🔒';

        // 更新完成状态
        this.updateCompletionStatus(container, true);
    }

    /**
     * 解锁区域
     * @param {HTMLElement} container - 容器元素
     * @param {HTMLTextAreaElement} textarea - 文本区域
     * @param {HTMLButtonElement} lockButton - 锁定按钮
     */
    unlockSection(container, textarea, lockButton) {
        container.classList.remove('locked');
        container.classList.add('unlocked');
        textarea.readOnly = false;
        lockButton.querySelector('.lock-icon').textContent = '🔓';

        // 更新完成状态
        this.updateCompletionStatus(container, false);
    }

    /**
     * 验证内容
     * @param {HTMLTextAreaElement} textarea - 文本区域
     * @returns {boolean} - 验证结果
     */
    validateContent(textarea) {
        if (!textarea.value.trim()) {
            alert('请先填写内容后再锁定');
            return false;
        }
        return true;
    }

    /**
     * 更新完成状态
     * @param {HTMLElement} container - 容器元素
     * @param {boolean} isComplete - 是否完成
     */
    updateCompletionStatus(container, isComplete) {
        const cellContent = container.closest('.cell-content');
        const indicator = cellContent.querySelector('.completion-indicator');
        if (indicator) {
            if (isComplete) {
                indicator.classList.add('complete');
                indicator.textContent = '✓';
            } else {
                indicator.classList.remove('complete');
                indicator.textContent = '';
            }
        }
    }

    /**
     * 自动保存内容
     * @param {string} sectionId - 区域ID
     * @param {string} content - 内容
     */
    autoSave(sectionId, content) {
        localStorage.setItem(`section_${sectionId}`, content);
        localStorage.setItem(`section_${sectionId}_timestamp`, new Date().toISOString());
    }

    /**
     * 恢复内容
     * @param {string} sectionId - 区域ID
     * @param {HTMLTextAreaElement} textarea - 文本区域
     */
    restoreContent(sectionId, textarea) {
        const savedContent = localStorage.getItem(`section_${sectionId}`);
        if (savedContent) {
            textarea.value = savedContent;
            // 检查是否之前已锁定
            if (this.lockedSections.has(sectionId)) {
                const container = textarea.closest('.lockable-content');
                this.lockSection(
                    container,
                    textarea,
                    container.querySelector('.lock-button')
                );
            }
        }
    }

    /**
     * 保存表单状态
     */
    saveFormState() {
        localStorage.setItem('lockedSections', JSON.stringify([...this.lockedSections]));
    }

    /**
     * 恢复表单状态
     */
    restoreFormState() {
        const savedSections = localStorage.getItem('lockedSections');
        if (savedSections) {
            this.lockedSections = new Set(JSON.parse(savedSections));
        }
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
    })
    .addToggleConfig('earlyRepaymentGroup', {
        positiveRadioId: 'hasEarlyRepayment',
        negativeRadioId: 'noEarlyRepayment',
        inputSelector: '.early-repayment-input'
    })
    .addToggleConfig('guaranteeGroup', {
        positiveRadioId: 'guaranteeYes',
        negativeRadioId: 'guaranteeNo',
        inputSelector: '.guarantee-input'
    })
    .addToggleConfig('debtCostGroup', {
        positiveRadioId: 'debtCostYes',
        negativeRadioId: 'debtCostNo',
        inputSelector: '.debt-cost-input'
    })
    .addToggleConfig('jurisdictionGroup', {
        positiveRadioId: 'jurisdictionYes',
        negativeRadioId: 'jurisdictionNo',
        inputSelector: '.jurisdiction-input'
})
    .addToggleConfig('overdueGroup', {
        positiveRadioId: 'isOverdueYes',
        negativeRadioId: 'isOverdueNo',
        inputSelector: '.overdue-input'
})
    .addToggleConfig('guaranteeContractGroup', {
        positiveRadioId: 'hasGuaranteeContractYes',
        negativeRadioId: 'hasGuaranteeContractNo',
        inputSelector: '.guarantee-contract-input'
})
    .addToggleConfig('maxGuaranteeGroup', {
        positiveRadioId: 'isMaxGuaranteeYes',
        negativeRadioId: 'isMaxGuaranteeNo',
        inputSelector: '.max-guarantee-input'
})
    .addToggleConfig('registrationGroup', {
        positiveRadioId: 'hasRegistrationYes',
        negativeRadioId: 'hasRegistrationNo',
        inputSelector: '.registration-input'
})
    .addToggleConfig('warrantyContractGroup', {
        positiveRadioId: 'hasWarrantyContractYes',
        negativeRadioId: 'hasWarrantyContractNo',
        inputSelector: '.warranty-contract-input'
})
    .addToggleConfig('otherGuaranteeGroup', {
        positiveRadioId: 'hasOtherGuaranteeYes',
        negativeRadioId: 'hasOtherGuaranteeNo',
        inputSelector: '.other-guarantee-input'
});

// 提供全局接口
window.FormHandler = FormHandler;
window.formHandler = formHandler;