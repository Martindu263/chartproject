document.addEventListener('DOMContentLoaded', function() {
    // 获取所有需要的元素
    const hasAgentRadio = document.getElementById('hasAgent');
    const noAgentRadio = document.getElementById('noAgent');
    const agentInputs = document.querySelectorAll('.agent-input');
    const agentRadios = document.querySelectorAll('.agent-radio');

    // 处理所有可切换的单选按钮
    document.querySelectorAll('.toggleable-radio').forEach(radio => {
        radio.addEventListener('click', function() {
            if (this.checked && this._wasChecked) {
                // 如果已经选中且是第二次点击，则取消选中
                this.checked = false;
                this._wasChecked = false;

                // 如果取消选中的是"无"选项，则恢复上方部分的可编辑状态
                if (this === noAgentRadio) {
                    enableAgentInputs();
                }
            } else {
                // 记录选中状态
                this._wasChecked = this.checked;

                // 如果选中的是"无"，则禁用上方部分
                if (this === noAgentRadio && this.checked) {
                    disableAgentInputs();
                }
            }
        });
    });

    // 禁用输入和选择功能
    function disableAgentInputs() {
        // 处理输入框
        agentInputs.forEach(input => {
            input.disabled = true;
            input.classList.add('disabled');
        });

        // 处理代理权限单选按钮
        agentRadios.forEach(radio => {
            radio.disabled = true;
            radio.classList.add('disabled');
        });

        // 禁用"有"选项
        hasAgentRadio.disabled = true;
    }

    // 恢复输入和选择功能
    function enableAgentInputs() {
        // 处理输入框
        agentInputs.forEach(input => {
            input.disabled = false;
            input.classList.remove('disabled');
        });

        // 处理代理权限单选按钮
        agentRadios.forEach(radio => {
            radio.disabled = false;
            radio.classList.remove('disabled');
        });

        // 启用"有"选项
        hasAgentRadio.disabled = false;
    }

    // 为"有"和"无"的单选按钮添加change事件监听器
    hasAgentRadio.addEventListener('change', function() {
        if (!this.checked) {
            enableAgentInputs();
        }
    });

    noAgentRadio.addEventListener('change', function() {
        if (this.checked) {
            disableAgentInputs();
        } else {
            enableAgentInputs();
        }
    });

    // 初始化状态
    if (noAgentRadio.checked) {
        disableAgentInputs();
    } else {
        enableAgentInputs();
    }
});