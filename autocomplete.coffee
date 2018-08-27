class Autocomplete
  constructor: (el) ->
    @$el = $(el)

    @$text     = @$el.find('input[type="text"]')
    @$fieldset = @$el.find('fieldset')
    @$radios   = @$fieldset.find('input[type="radio"]')
    @$alerts   = @$el.find('.alerts')

    @applyCheckedOptionToInput()
    @announceOptionsCount('')

    @attachEvents()

  attachEvents: ->
    @attachChangeEventToInput()

    @attachEscapeKeyToInput()
    @attachUpDownKeysToInput()

    @attachChangeEventToOptions()

  attachChangeEventToInput: ->
    @$text.on 'input propertychange paste', (e) =>
      @applyFilterToOptions(e.target.value)

  attachEscapeKeyToInput: ->
    @$text.keydown (e) =>
      if e.which == 27
        if @$radios.is(':checked')
          @$radios.prop('checked', false)
          @applyCheckedOptionToInputAndResetOptions()
          e.preventDefault()
        else # Needed for automatic testing only
          $('body').append('<p>Esc passed on.</p>')

  attachUpDownKeysToInput: ->
    @$text.keydown (e) =>
      if e.which == 38 || e.which == 40
        if e.which == 38
          @walkThroughOptions('up')
        else
          @walkThroughOptions('down')

        e.preventDefault()

  attachChangeEventToOptions: ->
    @$radios.change (e) =>
      @applyCheckedOptionToInput()
      @$text.select()

  walkThroughOptions: (direction) ->
    $visibleOptions = @$radios.filter(':visible')

    maxIndex = $visibleOptions.length - 1
    currentIndex = $visibleOptions.index($visibleOptions.parent().find(':checked'))

    upcomingIndex = if direction == 'up'
                      if currentIndex <= 0
                        maxIndex
                      else
                        currentIndex - 1
                    else
                      if currentIndex == maxIndex
                        0
                      else
                        currentIndex + 1

    $upcomingOption = $($visibleOptions[upcomingIndex])
    $upcomingOption.prop('checked', true).trigger('change')

  applyCheckedOptionToInput: ->
    $previouslyCheckedOptionLabel = $(@$el.find('.selected'))
    if $previouslyCheckedOptionLabel.length == 1
      $previouslyCheckedOptionLabel.removeClass('selected')

    $checkedOption = @$radios.filter(':checked')
    if $checkedOption.length == 1
      $checkedOptionLabel = $($checkedOption.parent()[0])
      @$text.val($.trim($checkedOptionLabel.text()))
      $checkedOptionLabel.addClass('selected')
    else
      @$text.val('')

  applyFilterToOptions: (filter) ->
    fuzzifiedFilter = @fuzzifyFilter(filter)
    visibleCount = 0

    @$radios.each (i, el) =>
      $option = $(el)
      $optionContainer = $option.parent()

      regex = new RegExp(fuzzifiedFilter, 'i')
      if regex.test($optionContainer.text())
        visibleCount++
        $optionContainer.removeAttr('hidden')
      else
        $optionContainer.attr('hidden', '')

    @announceOptionsCount(filter, visibleCount)

  applyCheckedOptionToInputAndResetOptions: ->
    @applyCheckedOptionToInput()
    @applyFilterToOptions('')

  announceOptionsCount: (filter = @$text.val(), count = @$radios.length) ->
    @$alerts.find('p').remove() # Remove previous alerts

    message = if filter == ''
                "#{count} options in total"
              else
                "#{count} of #{@$radios.length} options for <kbd>#{filter}</kbd>"

    @$alerts.append("<p>#{message}</p>")

  # See https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
  fuzzifyFilter: (filter) ->
    i = 0
    fuzzifiedFilter = ''

    while i < filter.length
      escapedCharacter = filter.charAt(i).replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
      fuzzifiedFilter += "#{escapedCharacter}.*?"
      i++

    fuzzifiedFilter

$(document).ready ->
  $('form').each ->
    new Autocomplete @
