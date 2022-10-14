; ((function (root, factory) {
    var hcCore = factory(root);
    if (typeof define === 'function' && define.amd) {
        // AMD
        define('hcCore', function () {
            return hcCore;
        });
    } else if (typeof exports === 'object') {
        // Node.js
        module.exports = hcCore;
    } else {
        // Browser globals
        var _hcCore = root.hcCore;

        hcCore.noConflict = function () {
            if (root.hcCore === hcCore) {
                root.hcCore = _hcCore;
            }

            return hcCore;
        };
        root.hcCore = hcCore;
    }
}(window, function (root) {
    function hcCore() {
    }
    hcCore.version = '0.0.1'; //版本
    hcCore.pageSize = 30; //分页时的默认记录数
    hcCore.showResult = function (rsp, success, error) {
        if (typeof rsp == "string") {
            if (vm) {
                vm.$message.info(rsp);
            }
            else {
                alert(rsp);
            }
        }
        else if (rsp && rsp.success === true) {
            if (typeof success == 'string') {
                if (vm) {
                    vm.$message.success(success);
                }
                else {
                    alert(success);
                }
            }
            else if (typeof success == "function") {
                success(rsp);
            }
            else {
                conosle.warn('提示对话框成功,参数异常');
            }
        }
        else {
            if (typeof error == 'function') {
                error(rsp);
                return;
            }

            if (typeof error == 'string') {
                if (rsp && rsp.message) {
                    if (vm) {
                        vm.$message.error(rsp.message);
                    }
                    else {
                        alert(rsp.message);
                    }
                }
                else {
                    if (vm) {
                        vm.$message.error(error);
                    }
                    else {
                        alert(error);
                    }
                }
            }
            else {
                console.warn('提示对话框错误参数异常');
            }
        }
    };
    hcCore.showSuccess = function (message) {
        if (vm) {
            vm.$message.success(message);
        }
        else {
            alert(message);
        }
    }
    hcCore.showError = function (message) {
        if (vm) {
            vm.$message.error(message);
        }
        else {
            alert(message);
        }
    }
    hcCore.confirm = function (message, success) {
        if (vm) {
            vm.$confirm(message, '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                success();
            }).catch(() => {
            });
        }
        else {
            let r = confirm(message);
            if (r) {
                success();
            }
        }
    }
    hcCore.post = async function (option) {
        let token = document.getElementsByName("__RequestVerificationToken");
        if (token) {
            token = token[0];
        }
        if (option.param && token) {
            option.param['__RequestVerificationToken'] = token.value;
        }
        option.success = option.success || '操作成功';
        option.fault = option.fault || '操作失败';
        option.loading = typeof option.loading == 'boolean' ? option.loading : true;
        let loadingInstance;
        if (option.loading) {
            if (vm) {
                loadingInstance = vm.$loading({ fullscreen: true });
            }
        }
        await axios.post(option.url, option.param)
            .then(function (response) {
                hcCore.showResult(response.data, option.success, option.fault);
                if (option.loading && loadingInstance) {
                    loadingInstance.close();
                }
            })
            .catch(function (error) {
                console.log(error);
                if (option.loading && loadingInstance) {
                    loadingInstance.close();
                }
            });
    }
    /**
     * 判断是否为数组
     * @param {any} obj 要判断的对象
     */
    hcCore.isArray = function (obj) {
        return typeof obj === 'Array';
    }
    /**
     * 转换成小驼峰写法
     * @param {String} str 要转换的字串
     */
    hcCore.toSmallHump = function (str) {
        let ret = str.replace((/[^a-zA-Z0-9]\w/g), function (v) {
            return v.substring(1).toUpperCase()
        })
        return ret;
    }

    /* 相关公共请求方法 */
    hcCore.getPowerButton = async function () {
        let buttonList = [];
        await hcCore.post({
            url: 'ListPowerAction'
            , success: function (rsp) {
                buttonList = rsp.data;
            }
        });
        return {
            all: buttonList
            , rowOp: buttonList.filter(p => p.act_type == 1 || p.act_type == 3) || []
            , topOp: buttonList.filter(p => p.act_type == 2 || p.act_type == 3) || []
            , hasQuery: !!buttonList.find(p => p.act_no == 'Query')
            , hasExport: !!buttonList.find(p => p.act_no == 'Export')
            , hasAdd: !!buttonList.find(p => p.act_no == 'Add')
            , hasEdit: !!buttonList.find(p => p.act_no == 'Edit')
        }
    }

    hcCore.getTerminal = async function () {
        let UA = navigator.userAgent;
        let isIPad = !!(UA.match(/(iPad).*OS\s([\d_]+)/)),
            isIphone = !!(!isIPad && UA.match(/(iPhone\sOS)\s([\d_]+)/)),
            isAndroid = !!(UA.match(/(Android)\s+([\d.]+)/)),
            isMobile = !!(isIphone || isAndroid);
        return {
            isIPad: isIPad ? 3 : 0
            , isIphone: isIphone ? 2 : 0
            , isAndroid: isAndroid ? 4 : 0
            , isMobile: isMobile ? 5 : 0
        }
    }

    hcCore.handleExport = function (url) {
        var elemIF = document.createElement('iframe')
        elemIF.src = url
        elemIF.style.display = 'none'
        document.body.appendChild(elemIF)
    }

    /*
     * 防抖,触发高频事件后n秒后函数只会执行一次，如果n秒内高频事件再次被触发，则重新计算时间
     */
    hcCore.debounce = function (fn, time) {
        time = time || 100;
        var timer = null;
        return function () {
            clearTimeout(timer);
            timer = setTimeout(() => {
                fn.apply(this, arguments);
            }, time);
        }
    }

    /*
     * 节流，在前一个请求结束之前，不会开启下一个请求
     */
    hcCore.throttle = async function (fn) {
        var canRun = true;
        return async function () {
            if (!canRun) return;
            canRun = false;
            await fn.apply(this, arguments);
            canRun = true;
        }
    }

    hcCore.WindowSize = function () {
        let winWidth, winHeight;
        //获取浏览器宽度
        if (window.innerWidth)
            winWidth = window.innerWidth;
        else if ((document.body) && (document.body.clientWidth))
            winWidth = document.body.clientWidth;

        //获取浏览器高度
        if (window.innerHeight)
            winHeight = window.innerHeight;
        else if ((document.body) && (document.body.clientHeight))
            winHeight = document.body.clientHeight;
        return {
            Width: winWidth,
            Height: winHeight
        };
    }

    /**
     * 获得当前时间
     * */
    hcCore.currentDateTime = function () {
        let today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth()+1;
        let day = today.getDate();
        let hour = today.getHours();
        let minute = today.getMinutes();
        let second = today.getSeconds();
        return year + '-' + hcCore.padLeft(month, 2) + '-' + hcCore.padLeft(day, 2) + ' ' + hcCore.padLeft(hour, 2) + ':' + hcCore.padLeft(minute, 2) + ':' + hcCore.padLeft(second,2);
    }

    /**
     * 获得当前时间
     * */
    hcCore.currentDate = function () {
        let today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth() + 1;
        let day = today.getDate();
        return year + '-' + hcCore.padLeft(month, 2) + '-' + hcCore.padLeft(day, 2);
    }

    /**
     * 把指定日期转换成指定格式的字符串
     * */
    hcCore.DateToString = function (date) {
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let hour = date.getHours();
        let minute = date.getMinutes();
        let second = date.getSeconds();
        return year + '-' + hcCore.padLeft(month, 2) + '-' + hcCore.padLeft(day, 2);
    }

    /**
     * 自动填充左边字符串
     * @param {any} str 
     * @param {any} char
     * @param {any} len
     */
    hcCore.padLeft = function (str, len, char) {
        char = char || '0';
        let pad = char.repeat(len);
        return ('' + pad + str).slice(-1 * len);
    }

    /**
     * 格式化时间为 s秒 m分钟 h小时
     * @param {any} time
     */
    hcCore.secondFomat = function (time) {
        if (time > 3600) return (time / 3600).toFixed(2) + ' h';
        else if (time > 60) return (time / 60).toFixed(2) + ' m';
        else return time.toFixed(2) + ' s';
    }

    /**
     * 格式化时间为 s秒 m分钟 h小时
     * @param {any} time
     */
    hcCore.millSecondFomat = function (time) {
        time = time / 1000;
        if (time > 3600) return (time / 3600).toFixed(2) + ' h';
        else if (time > 60) return (time / 60).toFixed(2) + ' m';
        else return time.toFixed(2) + ' s';
    }

    /**
     * 触发全屏或退出全屏
     * @param {any} el 触发的元素
     */
    hcCore.fullScreen = function (el) {
        var isFullscreen = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
        if (!isFullscreen) { //进入全屏,多重短路表达式
            (el.requestFullscreen && el.requestFullscreen()) ||
                (el.mozRequestFullScreen && el.mozRequestFullScreen()) ||
                (el.webkitRequestFullscreen && el.webkitRequestFullscreen()) || (el.msRequestFullscreen && el.msRequestFullscreen());

        } else { //退出全屏,三目运算符
            document.exitFullscreen ? document.exitFullscreen() :
                document.mozCancelFullScreen ? document.mozCancelFullScreen() :
                    document.webkitExitFullscreen ? document.webkitExitFullscreen() : '';
        }
    }

    /**
     * 全屏或退出全屏
     * @param {any} e 触发的元素
     */
    hcCore.toggleFullScreen = function (e) {
        var el = e.srcElement || e.target; //target兼容Firefor
        hcCore.fullScreen(el);
    }

    return hcCore;
})));

if (document.getElementById('fullscreen')) {
    let bodyMouseMoveHandle = hcCore.debounce(function () {
        document.getElementById('fullscreen').style.display = "none";
    }, 10000);

    document.body.onmousemove = function () {
        document.getElementById('fullscreen').style.display = 'block';
        bodyMouseMoveHandle();
    };
}