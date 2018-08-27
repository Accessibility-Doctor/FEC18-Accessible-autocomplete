(function() {
  var Autocomplete;

  Autocomplete = class Autocomplete {
    constructor(el) {
      this.$el = $(el);
      this.$text = this.$el.find('input[type="text"]');
      this.$fieldset = this.$el.find('fieldset');
      this.$radios = this.$fieldset.find('input[type="radio"]');
      this.$alerts = this.$el.find('#alerts');
      this.applyCheckedOptionToInput();
      this.announceOptionsCount('');
      this.attachEvents();
    }

    attachEvents() {
      this.attachClickEventToInput();
      this.attachChangeEventToInput();
      this.attachEscapeKeyToInput();
      this.attachSpaceKeyToInput();
      this.attachEnterKeyToInput();
      this.attachTabKeyToInput();
      this.attachUpDownKeysToInput();
      this.attachChangeEventToOptions();
      this.attachClickEventToOptions();
      return this.attachFocusOut();
    }

    attachClickEventToInput() {
      return this.$text.click(() => {
        if (!this.$fieldset.attr('hidden')) {
          return this.hideOptions();
        } else {
          return this.showOptions();
        }
      });
    }

    attachChangeEventToInput() {
      return this.$text.on('input propertychange paste', (e) => {
        this.applyFilterToOptions(e.target.value);
        return this.showOptions();
      });
    }

    attachEscapeKeyToInput() {
      return this.$text.keydown((e) => {
        if (e.which === 27) {
          if (!this.$fieldset.attr('hidden')) {
            this.applyCheckedOptionToInputAndResetOptions();
            return e.preventDefault();
          } else if (this.$radios.is(':checked')) {
            this.$radios.prop('checked', false);
            this.applyCheckedOptionToInputAndResetOptions();
            return e.preventDefault(); // Needed for automatic testing only
          } else {
            return $('body').append('<p>Esc passed on.</p>');
          }
        }
      });
    }

    attachSpaceKeyToInput() {
      return this.$text.keydown((e) => {
        if (e.which === 32) {
          if (this.$fieldset.attr('hidden') && this.$text.val() === '') {
            this.showOptions();
            return e.preventDefault(); // Needed for automatic testing only
          } else {
            return $('body').append('<p>Space passed on.</p>');
          }
        }
      });
    }

    attachEnterKeyToInput() {
      return this.$text.keydown((e) => {
        if (e.which === 13) {
          if (!this.$fieldset.attr('hidden')) {
            this.applyCheckedOptionToInputAndResetOptions();
            return e.preventDefault(); // Needed for automatic testing only
          } else {
            return $('body').append('<p>Enter passed on.</p>');
          }
        }
      });
    }

    attachTabKeyToInput() {
      return this.$text.keydown((e) => {
        if (e.which === 9) {
          if (!this.$fieldset.attr('hidden')) {
            return this.applyCheckedOptionToInputAndResetOptions();
          }
        }
      });
    }

    attachUpDownKeysToInput() {
      return this.$text.keydown((e) => {
        if (e.which === 38 || e.which === 40) {
          if (!this.$fieldset.attr('hidden')) {
            if (e.which === 38) {
              this.walkThroughOptions('up');
            } else {
              this.walkThroughOptions('down');
            }
          } else {
            this.showOptions();
          }
          return e.preventDefault();
        }
      });
    }

    attachChangeEventToOptions() {
      return this.$radios.change((e) => {
        this.applyCheckedOptionToInput();
        return this.$text.focus().select();
      });
    }

    attachClickEventToOptions() {
      return this.$radios.click((e) => {
        return this.hideOptions();
      });
    }

    attachFocusOut() {
      return this.$el.focusout(() => {
        if (!this.$fieldset.attr('hidden') && !this.$el.is(':hover')) {
          this.applyCheckedOptionToInputAndResetOptions();
          return this.hideOptions();
        }
      });
    }

    showOptions() {
      this.$fieldset.removeAttr('hidden');
      return this.$text.attr('aria-expanded', 'true');
    }

    hideOptions() {
      this.$fieldset.attr('hidden', '');
      return this.$text.attr('aria-expanded', 'false');
    }

    walkThroughOptions(direction) {
      var $upcomingOption, $visibleOptions, currentIndex, maxIndex, upcomingIndex;
      $visibleOptions = this.$radios.filter(':visible');
      maxIndex = $visibleOptions.length - 1;
      currentIndex = $visibleOptions.index($visibleOptions.parent().find(':checked'));
      upcomingIndex = direction === 'up' ? currentIndex <= 0 ? maxIndex : currentIndex - 1 : currentIndex === maxIndex ? 0 : currentIndex + 1;
      $upcomingOption = $($visibleOptions[upcomingIndex]);
      return $upcomingOption.prop('checked', true).trigger('change');
    }

    applyCheckedOptionToInput() {
      var $checkedOption, $checkedOptionLabel, $previouslyCheckedOptionLabel;
      $previouslyCheckedOptionLabel = $(this.$el.find('.selected'));
      if ($previouslyCheckedOptionLabel.length === 1) {
        $previouslyCheckedOptionLabel.removeClass('selected');
      }
      $checkedOption = this.$radios.filter(':checked');
      if ($checkedOption.length === 1) {
        $checkedOptionLabel = $($checkedOption.parent()[0]);
        this.$text.val($.trim($checkedOptionLabel.text()));
        return $checkedOptionLabel.addClass('selected');
      } else {
        return this.$text.val('');
      }
    }

    applyFilterToOptions(filter) {
      var fuzzifiedFilter, visibleCount;
      fuzzifiedFilter = this.fuzzifyFilter(filter);
      visibleCount = 0;
      this.$radios.each((i, el) => {
        var $option, $optionContainer, regex;
        $option = $(el);
        $optionContainer = $option.parent();
        regex = new RegExp(fuzzifiedFilter, 'i');
        if (regex.test($optionContainer.text())) {
          visibleCount++;
          return $optionContainer.removeAttr('hidden');
        } else {
          return $optionContainer.attr('hidden', '');
        }
      });
      return this.announceOptionsCount(filter, visibleCount);
    }

    applyCheckedOptionToInputAndResetOptions() {
      this.applyCheckedOptionToInput();
      this.hideOptions();
      return this.applyFilterToOptions('');
    }

    announceOptionsCount(filter = this.$text.val(), count = this.$radios.length) {
      var message;
      this.$alerts.find('p').remove(); // Remove previous alerts
      message = filter === '' ? `${count} options in total` : `${count} of ${this.$radios.length} options for <kbd>${filter}</kbd>`;
      return this.$alerts.append(`<p role='alert'>${message}</p>`);
    }

    // See https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    fuzzifyFilter(filter) {
      var escapedCharacter, fuzzifiedFilter, i;
      i = 0;
      fuzzifiedFilter = '';
      while (i < filter.length) {
        escapedCharacter = filter.charAt(i).replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        fuzzifiedFilter += `${escapedCharacter}.*?`;
        i++;
      }
      return fuzzifiedFilter;
    }

  };

  $(document).ready(function() {
    return $('form').each(function() {
      return new Autocomplete(this);
    });
  });

}).call(this);
