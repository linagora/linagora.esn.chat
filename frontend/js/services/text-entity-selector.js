(function() {
  'use strict';

  angular.module('linagora.esn.chat').factory('ChatTextEntitySelector', function(KEY_CODE, $q, chatHumanizeEntitiesLabel, _) {

    function ChatTextEntitySelector(entityListResolver, startChar, endChar, toHumanLabel, toRealValue) {
      if (Boolean(toHumanLabel) !== Boolean(toRealValue)) {
        throw new Error('You should provide toRealValue if you give toHumanValue');
      }

      this._entityListResolver = entityListResolver;
      this.toHumanLabel = toHumanLabel || _.identity;
      this.toRealValue = toRealValue || _.identity;
      this._resetState();

      var matchStartChar = startChar === '^' ? '\\^' : '[' + startChar + ']';
      this.REGEXP_ENTITY_IN_EDITION = new RegExp(matchStartChar + '([a-zA-Z0-9_+-]+)$');
      this.endChar = endChar || '';
      this.startChar = startChar;

      this.NUMBER_ENTITY_DISPLAYED = 20;
    }

    ChatTextEntitySelector.entityListResolverFromList = function(entityList) {
      return function(start) {
        return $q.when(entityList.filter(function(e) {
          return e.indexOf(start) === 0;
        }));
      };
    };

    ChatTextEntitySelector.prototype._resetState = function() {
      this.visible = false;
      this.focusIndex = 0;
      this.entityStart = '';
    };

    ChatTextEntitySelector.prototype.hide = function() {
      this._resetState();
    };

    ChatTextEntitySelector.prototype.show = function(textareaAdapter) {
      this.textarea = textareaAdapter;
      if (this.textarea.selectionStart !== this.textarea.selectionEnd) {
        this._resetState();
        return;
      }
      var self = this;
      this._entityListResolver('').then(function(entityList) {
        self.inEdition = '';
        self.setEntityList(entityList);
        self.visible = true;
        self.focusIndex = 0;
      });
    };

    ChatTextEntitySelector.prototype.select = function(entity, event) {
      if (event) {
        event.preventDefault();
      }
      this._insertEntityTag(entity);
      this._resetState();
    };

    ChatTextEntitySelector.prototype.textChanged = function(textareaAdapter) {
      var self = this;
      this.textarea = textareaAdapter;

      if (this.textarea.selectionStart !== this.textarea.selectionEnd) {
        this._resetState();
        return;
      }

      var inEdition = this._entityInEdition(this.textarea.value, this.textarea.selectionStart);

      if (!inEdition || inEdition.length < 2) {
        this._resetState();
        return;
      }

      this._entityListResolver(inEdition).then(function(entityList) {
        self.setEntityList(entityList);
        if (self.entityList.length) {
          self.entityStart = inEdition;
          self.visible = true;
        } else {
          self._resetState();
        }
      });
    };

    ChatTextEntitySelector.prototype.keyDown = function(event) {
      if (!this.visible) {
        return;
      }

      var keyCode = event.keyCode || event.which || 0;

      if (keyCode === KEY_CODE.ENTER) {
        event.preventDefault();
        this.select(this.entityListDisplayed[this.focusIndex]);
      } else if (keyCode === KEY_CODE.ARROW_UP || keyCode === KEY_CODE.ARROW_LEFT) {
        event.preventDefault();
        this._updateFocusIndex(-1);
      } else if (keyCode === KEY_CODE.ARROW_DOWN || keyCode === KEY_CODE.ARROW_RIGHT || isTab(event)) {
        event.preventDefault();
        this._updateFocusIndex(1);
      }
    };

    ChatTextEntitySelector.prototype._insertEntityTag = function(entity) {
      var value = this.textarea.value,
      selectionStart = this.textarea.selectionStart;

      if (selectionStart > value.length) {
        var lim = selectionStart - value.length;
        for (var i = 0; i < lim; i++) {
          value = value + ' ';
        }
      }
      var valueStart = value.substring(0, selectionStart),
      valueEnd = value.substring(selectionStart);

      var regexp = valueStart.match(this.REGEXP_ENTITY_IN_EDITION);
      var distanceToColon = 0;
      if (regexp) {
        distanceToColon = this.startChar.length;
        distanceToColon = distanceToColon + valueStart.match(this.REGEXP_ENTITY_IN_EDITION)[1].length;
      }

      var humanLabel = this.startChar + this.toHumanLabel(entity) + this.endChar;

      if (this.toHumanLabel !== this.toRealValue) {
        humanLabel = chatHumanizeEntitiesLabel.addHumanRepresentation(humanLabel, this.startChar + this.toRealValue(entity) + this.endChar);
      }

      var newValueStart = valueStart.substr(0, valueStart.length - distanceToColon) + humanLabel;
      this.textarea.replaceText(newValueStart  + valueEnd, newValueStart.length, newValueStart.length);
    };

    ChatTextEntitySelector.prototype._entityInEdition = function(text, cursorNextChar) {
      var textUntilCursorEnd = text.substring(0, cursorNextChar);
      var entityLast = textUntilCursorEnd.match(this.REGEXP_ENTITY_IN_EDITION);
      if (entityLast) {
        return entityLast[1];
      }
    };

    ChatTextEntitySelector.prototype._updateFocusIndex = function(diff) {
      if (this.focusIndex + diff >= this.entityListDisplayed.length) {
        this.loadMoreElements();
      }

      this.focusIndex = (this.focusIndex + this.entityListDisplayed.length + diff) % this.entityListDisplayed.length;
    };

    ChatTextEntitySelector.prototype.setEntityList = function(entityList) {
      this.entityList = entityList;
      this.entityListDisplayed = entityList.slice(0, this.NUMBER_ENTITY_DISPLAYED);
    };

    ChatTextEntitySelector.prototype.loadMoreElements = function() {
      var self = this;
      this.entityList.slice(this.entityListDisplayed.length, this.entityListDisplayed.length + this.NUMBER_ENTITY_DISPLAYED).map(function(entity) {
        self.entityListDisplayed.push(entity);
      });
    };

    function isTab(event) {
      var keyCode = event.keyCode || event.which || 0;

      return keyCode === KEY_CODE.TAB && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey;
    }

    return ChatTextEntitySelector;
  });
})();
