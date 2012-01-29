/*!
 * jQUery changing plugin by Scott Rippey (https://gist.github.com/1243592)
 *
 * This plugin provides a "changing" event that fires immediately as an input is changing.
 * The "changing" event will only fire once per change.
 * The event is more immediate and consistent than the "change" event, and normalizes behavior between browsers.
 *
 * This plugin specifically improves following inputs: textbox, textarea, checkbox, radio, and select,
 * and it falls back to the "change" event for all other inputs.
 *
 * The code is based off of: 
 *
 * Great event reference: http://www.quirksmode.org/dom/events/change.html
 *
 * jQuery TextChange Plugin 
 * http://www.zurb.com/playground/jquery-text-change-custom-event
 *
 * Copyright 2012 Scott Rippey
 * Released under the MIT License
 *
 */
(function ($) {
    
    var changing = $.event.special.changing = {
        
        setup: function (data, namespaces) {
            var element = $(this);
            element.data('lastValue', changing.getInputValue(element));

            // Determine which events to bind to, depending on the element type:
            var events = "change", delayedEvents = "";
            var handler = changing.handler, delayedHandler = changing.delayedHandler;
            if (element.is("select")) {
                events += " keyup click";
            } else if (element.is("input[type=text], input[type=password], textarea")) {
                // Notes: blur is necessary because some actions don't fire change events: (eg: clicking a "form history" item; "right-click > delete" in IE)
                events += " keyup blur";
                delayedEvents = "cut paste input";
            } else if (element.is("input[type=checkbox]")) {
                // In IE, checkboxes only change on blur
                if ($.browser.msie) events += " click";
            } else if (element.is("input[type=radio]")) {
                // change event is NOT raised when a radio loses the check, so fix that:
                handler = changing.radioHandler;
            }

            // Add a namespace to events:
            events = events.replace(/\w+/g, "$&.changing");
            delayedEvents = delayedEvents.replace(/\w+/g, "$&.changing");
            // Bind the events:
            element.bind(events, handler);
            if (delayedEvents) element.bind(delayedEvents, delayedHandler);
        },
        
        teardown: function (namespaces) {
            $(this).unbind('.changing');
        },
        
        handler: function (event) {
            changing.triggerIfChanged($(this), event);
        },
        
        radioHandler: function (event) {
            var element = $(this);
            var name = element.attr("name");
            // Find all radios in the same group:
            var container = element.closest("form");
            container
                .find("input[type=radio][name='" + name + "']")
                .each(function(){
                    changing.triggerIfChanged($(this), event);
                });
        },
        
        delayedHandler: function (event) {
            var element = $(this);
            setTimeout(function () {
                changing.triggerIfChanged(element, event);
            }, 25);
        },
        
        triggerIfChanged: function (element, realEvent) {
            var current = changing.getInputValue(element);
            var oldVal = element.data("lastValue");
            if (current !== oldVal) {
                element.data('lastValue', current);
                element.trigger('changing', [oldVal, current, realEvent]);
            }
        },
        
        // Helper function to get the control's value as a string:
        getInputValue: function(element) {
            return (element[0].contentEditable === 'true' ? element.html() :
                element.is("input[type=checkbox], input[type=radio]") ? element.is(":checked") :
                element.is("select[multiple]") ? (element.val() && element.val().join(",") || "") :
                element.val());
        }

    };
    

    // Add a bind-shortcut (eg. $(...).changing(...) )
    $.fn.extend({
        changing: function( data, fn ) {
            /// <summary>
            ///    Bind an event handler to the special "changing" event, or trigger that event on an element.
            ///        1: changing(handler(eventObject, oldValue, newValue, realEventObject)) - Attaches a handler for the changing event.
            ///        2: changing(eventData, handler(eventObject, oldValue, newValue, realEventObject)) - Attaches a handler for the changing event with custom data.
            ///        3: changing() - Triggers the changing event.
            /// </summary>
            /// <param name="data" type="Object">
            ///     A map of data that will be passed to the event handler.
            /// </param>
            /// <param name="fn" type="Function">
            ///     A function to execute each time the event is triggered.
            ///     The function will be called with 4 parameters.
            ///     1: eventObject - The standard jQuery event object.
            ///     2: oldValue - The previous value of the input before the change.
            ///     3: newValue - The input's current value. Note, for checkboxes and radios, it will be either true or false.
            ///     4: realEventObject - The actual event that caused the changing event. Can be null if hte event was manually triggered. This is primarily for debugging purposes.
            /// </param>
            /// <returns type="jQuery" />
            
            if (arguments.length >= 2) {
                return this.bind( 'changing', data, fn );
            } else if (arguments.length == 1) {
                return this.bind( 'changing', data);
            } else {
                var val = changing.getInputValue($(this));
                return this.trigger( 'changing' , [val, val, null]);
            }
        }
    });

    // Here are 2 specialty events for textboxes, "hastext" and "notext".
    // Use "bind syntax" to use these events - $(...).bind("hastext notext", ...)
    
    var hastext = $.event.special.hastext = {
        
        setup: function (data, namespaces) {
            $(this).bind('changing', hastext.handler);
        },
        
        teardown: function (namespaces) {
            $(this).unbind('changing', hastext.handler);
        },
        
        handler: function (event, oldVal, current, realEvent) {
            if (oldVal === '') {
                $(this).trigger('hastext', [oldVal, current, realEvent]);
            }
        }
    };
    
    var notext = $.event.special.notext = {
        
        setup: function (data, namespaces) {
            $(this).bind('changing', notext.handler);
        },
        
        teardown: function (namespaces) {
            $(this).unbind('changing', notext.handler);
        },
        
        handler: function (event, oldVal, current, realEvent) {
            if (current === '') {
                $(this).trigger('notext', [oldVal, current, realEvent]);
            }
        }
    };    
})(jQuery);