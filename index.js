var S = {
    init: function () {
        S.Drawing.init('.canvas');
        document.body.classList.add('body--ready');
        // 只显示前两个动画：文本和倒计时
        S.UI.simulate("祝彭欣欣|生日快乐哟");
        S.Drawing.loop(function () {
            S.Shape.render();
        });
    }
};
S.Drawing = (function () {
    var canvas,
    context,
    renderFn,
    requestFrame = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 2000 / 60);
    };
    return {
        init: function (el) {
            canvas = document.querySelector(el);
            context = canvas.getContext('2d');
            this.adjustCanvas();
            window.addEventListener('resize', function (e) {
                S.Drawing.adjustCanvas();
            });
        },
        loop: function (fn) {
            renderFn = !renderFn ? fn : renderFn;
            this.clearFrame();
            renderFn();
            requestFrame.call(window, this.loop.bind(this));
        },
        adjustCanvas: function () {
            canvas.width = window.innerWidth - 100;
            canvas.height = window.innerHeight - 30;
        },
        clearFrame: function () {
            context.clearRect(0, 0, canvas.width, canvas.height);
        },
        getArea: function () {
            return {w: canvas.width, h: canvas.height};
        },
        drawCircle: function (p, c) {
            context.fillStyle = c.render();
            context.beginPath();
            context.arc(p.x, p.y, p.z, 0, 2 * Math.PI, true);
            context.closePath();
            context.fill();
        }
    };
}());
S.UI = (function () {
    var interval,
    currentAction,
    time,
    maxShapeSize = 30,
    sequence = [],
    cmd = '#';
    function formatTime(date) {
        var h = date.getHours(),
        m = date.getMinutes(),
        m = m < 10 ? '0' + m : m;
        return h + ':' + m;
    }
    function getValue(value) {
        return value && value.split(' ')[1];
    }
    function getAction(value) {
        value = value && value.split(' ')[0];
        return value && value[0] === cmd && value.substring(1);
    }
    function timedAction(fn, delay, max, reverse) {
        clearInterval(interval);
        currentAction = reverse ? max : 1;
        fn(currentAction);
        if (!max || (!reverse && currentAction < max) || (reverse && currentAction > 0)) {
            interval = setInterval(function () {
                currentAction = reverse ? currentAction - 1 : currentAction + 1;
                fn(currentAction);
                if ((!reverse && max && currentAction === max) || (reverse && currentAction === 0)) {
                    clearInterval(interval);
                }
            }, delay);
        }
    }
    function performAction(value) {
    var action,
        value,
        current;
    sequence = typeof (value) === 'object' ? value : sequence.concat(value.split('|'));
    timedAction(function (index) {
        current = sequence.shift();
        action = getAction(current);
        value = getValue(current);
        switch (action) {
            case 'countdown':
                value = parseInt(value) || 10;
                value = value > 0 ? value : 10;
                timedAction(function (index) {
                    if (index === 0) {
                        if (sequence.length === 0) {
                            S.Shape.switchShape(S.ShapeBuilder.letter(''));
                        } else {
                            performAction(sequence);
                        }
                    } else {
                        S.Shape.switchShape(S.ShapeBuilder.letter(index), true);
                    }
                }, 1000, value, true);
                break;
            case 'time':
                var t = formatTime(new Date());
                if (sequence.length > 0) {
                    S.Shape.switchShape(S.ShapeBuilder.letter(t));
                } else {
                    timedAction(function () {
                        t = formatTime(new Date());
                        if (t !== time) {
                            time = t;
                            S.Shape.switchShape(S.ShapeBuilder.letter(time));
                        }
                    }, 1000);
                }
                break;
            default:
                // Handle unexpected actions here, or clear out the sequence
                S.Shape.switchShape(S.ShapeBuilder.letter(current[0] === cmd ? 'HacPai' : current));
        }
    }, 2000, sequence.length);
}
    return {
        simulate: function (action) {
            performAction(action);
        }
    };
}());
S.Point = function (args) {
    this.x = args.x;
    this.y = args.y;
    this.z = args.z;
    this.a = args.a;
    this.h = args.h;
};
S.Color = function (r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
};
S.Color.prototype = {
    render: function () {
        return 'rgba(' + this.r + ',' + +this.g + ',' + this.b + ',' + this.a + ')';
    }
};
S.Dot = function (x, y) {
    this.p = new S.Point({
        x: x,
        y: y,
        z: 5,
        a: 1,
        h: 0
    });
    this.e = 0.07;
    this.s = true;
    this.c = new S.Color(255, 255, 255, this.p.a);
    this.t = this.clone();
    this.q = [];
};
S.Dot.prototype = {
    clone: function () {
        return new S.Point({
            x: this.x,
            y: this.y,
            z: this.z,
            a: this.a,
            h: this.h
        });
    },
    _draw: function () {
        this.c.a = this.p.a;
        S.Drawing.drawCircle(this.p, this.c);
    },
    _moveTowards: function (n) {
        var details = this.distanceTo(n, true),
        dx = details[0],
        dy = details[1],
        d = details[2],
        e = this.e * d;
        if (this.p.h === -1) {
            this.p.x = n.x;
            this.p.y = n.y;
            return true;
        }
        if (d > 1) {
            this.p.x -= ((dx / d) * e);
            this.p.y -= ((dy / d) * e);
        } else {
            if (this.p.h > 0) {
                this.p.h--;
            } else {
                return true;
            }
        }
        return false;
    },
    _update: function () {
        if (
