/*
 * jQuery analogclock v0.4
 * http://makealone.jp/products/jquery.analogclock/
 *
 * Copyright 2013, makealone.jp
 * Free to use and abuse under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */

(function($) {
    $.fn.analogclock = function(options) {
        var undefined;

        // options
        //
        // size -- [width, height]
        // background_color -- background color
        //
        // frame_fill_color -- clock backbord color
        // frame_color -- clock frame color
        // frame_width -- clock frame width
        //
        // zone_fill_color -- zone backbord color
        // zone_ranges -- zone range list. range begin and end point by minutes.
        //                example: [[0,15], [30, 45]]
        //
        // minute_color -- minute hand color
        // minute_width -- minute hand width
        // minute_shape -- minute hand shape. set with rerative scale(radius=1.0).
        //
        // hour_color -- hour hand color
        // hour_width -- hour hand width
        // hour_shape -- hour hand shape. set with rerative scale(radius=1.0).
        //
        // dot_color -- minute mark color
        // dot_width -- minute mark width
        // dot_shape -- minute mark shape. set with rerative scale(radius=1.0).
        //              example: [[0, -0.9], [0, -0.95]]
        // dot_minutes -- where put dot. point by minutes.
        //

        // settings
        var defaults = {size: [100, 100],
                        background_color: "rgba(0, 0, 0, 0)",

                        frame_fill_color: "#ffffff",
                        frame_color: "#808080",
                        frame_width: 4,

                        zone_fill_color: "#808080",
                        zone_ranges: [],

                        minute_color: "#404040",
                        minute_width: 2,
                        minute_shape: [[0, 0], [0, -0.9]],

                        hour_color: "#404040",
                        hour_width: 3,
                        hour_shape: [[0, 0], [0, -0.7]],

                        dot_color: "#808080",
                        dot_width: 2,
                        dot_shape: [[0, -0.9], [0, -0.95]],
                        dot_minutes: [0, 15, 30, 45]
                       };

        // environment
        var isTouchSupported = 'ontouchstart' in window;
        var dpr = window.devicePixelRatio;  // dot per pixel
        if (dpr == undefined) {
            dpr = 1;
        }
        var opts = $.extend(defaults, options);

        // define
        var AC_HOUR = 'analogclock_hour';
        var AC_MINUTE = 'analogclock_minute';

        // functions
        function get_hour(self) {
            return self.data(AC_HOUR);
        }

        function get_minute(self) {
            return self.data(AC_MINUTE);
        }

        function set_time(self, hour, minute) {
            self.data(AC_HOUR, hour);
            self.data(AC_MINUTE, minute);
        }

        function convClockToCanvas(radian) {
            return radian - (Math.PI / 2);
        }

        function convDegreeToRadian(degree) {
            return ((degree % 360) * Math.PI) / 180;
        }

        function getMinuteHandAngle(minute) {
            return convDegreeToRadian((minute % 60) * 6);
        }

        function getHourHandAngle(hour, minute) {
            return convDegreeToRadian((hour % 12) * 30 + (minute % 60) / 2);
        }

        // containes all method
        var methods = {
            create: function() {
                return this.each(function(i) {
                    var $this = $(this);

                    // create dom
                    var theCanvas = document.createElement("canvas");
                    var context = theCanvas.getContext('2d');
                    var $theCanvas = $(theCanvas);

                    var vp_width = opts.size[0];
                    var vp_height = opts.size[1];
                    var scope_width = vp_width * dpr;
                    var scope_height = vp_height * dpr;
                    theCanvas.setAttribute('width', scope_width);
                    theCanvas.setAttribute('height', scope_height);
                    $(theCanvas).width(vp_width);
                    $(theCanvas).height(vp_height);

                    //console.log("debug:" + scope_width + ", " + scope_height);

                    $this.append(theCanvas);

                    // draw
                    function draw(hour, minute) {
                        var cx = scope_width / 2 + 0.5;
                        var cy = scope_height / 2 + 0.5;
                        var max_radius = Math.min(cx, cy) - 1;

                        // background color
                        context.setTransform(1, 0, 0, 1, 0, 0);
                        context.fillStyle = opts.background_color;
                        context.fillRect(0, 0, scope_width, scope_height);
                        context.beginPath();
                        context.lineWidth = 1;
                        context.arc(cx, cy, max_radius, 0, Math.PI * 2, false);
                        context.clip();
                        context.clearRect(0, 0, scope_width, scope_height);
                        context.beginPath();
                        context.rect(0, 0, scope_width, scope_height);
                        context.clip();


                        // frame
                        context.setTransform(1, 0, 0, 1, 0, 0);
                        context.translate(cx, cy);
                        context.fillStyle = opts.frame_fill_color;
                        context.strokeStyle = opts.frame_color;
                        context.lineWidth = opts.frame_width * dpr;
                        var radius = max_radius - context.lineWidth / 2;
                        context.lineCap = "round";
                        context.lineJoin = "round";
                        context.beginPath();
                        context.arc(0, 0, radius, 0, Math.PI * 2);
                        context.fill();
                        context.beginPath();
                        context.arc(0, 0, radius, 0, Math.PI * 2);
                        context.stroke();

                        // zone
                        context.setTransform(1, 0, 0, 1, 0, 0);
                        context.translate(cx, cy);
                        context.fillStyle = opts.zone_fill_color;
                        jQuery.each(opts.zone_ranges, function(idx, item) {
                            var begin = getMinuteHandAngle(item[0]);
                            var end = getMinuteHandAngle(item[1]);
                            context.beginPath();
                            context.moveTo(0, 0);
                            context.arc(0, 0, radius,
                                        convClockToCanvas(begin),
                                        convClockToCanvas(end)
                                       );
                            context.lineTo(0, 0);
                            context.fill();
                        });

                        function drawShape(angle, color, width, shape) {
                            context.setTransform(1, 0, 0, 1, 0, 0);
                            context.translate(cx, cy);
                            context.rotate(angle);

                            context.strokeStyle = color;
                            context.lineWidth = width;
                            context.beginPath();
                            jQuery.each(shape, function(idx, item) {
                                var x = item[0] * max_radius;
                                var y = item[1] * max_radius;
                                //console.log("debug:", x, y);
                                if (idx == 0) {
                                    context.moveTo(x, y);
                                } else {
                                    context.lineTo(x, y);
                                }
                            });
                            context.stroke();
                        }

                        // minute hand
                        drawShape(getMinuteHandAngle(minute),
                                  opts.minute_color,
                                  opts.minute_width * dpr,
                                  opts.minute_shape);

                        // hour hand
                        drawShape(getHourHandAngle(hour, minute),
                                  opts.hour_color,
                                  opts.hour_width * dpr,
                                  opts.hour_shape);

                        // dot
                        jQuery.each(opts.dot_minutes, function(idx, minute) {
                            drawShape(getMinuteHandAngle(minute),
                                      opts.dot_color,
                                      opts.dot_width * dpr,
                                      opts.dot_shape);
                        });
                    }

                    $this.bind('_redraw', function() {
                        var hour = get_hour($this);
                        var minute = get_minute($this);
                        draw(hour, minute);
                    });

                    // init
                    var dt = new Date();
                    var hour = dt.getHours();
                    var minute = dt.getMinutes();
                    set_time($this, hour, minute);

                    draw(hour, minute);
                });
            },
            update: function (hour, minute) {
                var $this = $(this);
                if (arguments.length < 2) {
                    var dt = new Date();
                    hour = dt.getHours();
                    minute = dt.getMinutes();
                }
                set_time($this, hour, minute);
                $this.trigger('_redraw');
            }
        };

        // do
        if (methods[options]) {
            return methods[options].apply( this, Array.prototype.slice.call(arguments, 1));
        } else {
            return methods.create.apply(this);
        }
    };

})(jQuery);
