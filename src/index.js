/** Class representing a Filter */
class Filter {
  /**
     * Create the Filter instance
     * @param {string} filterAttr - filters identification attribute
     * @param {string} formAttr - filters form identification attribute
     */
  constructor(options) {
    this.filterAttr = options.filterAttr;
    this.formAttr = options.formAttr;

    this.$form = document.querySelector(`[${this.formAttr}]`);
    this.url = new URL(window.location.href);
    this.urlFilters = new URLSearchParams(
      decodeURIComponent(this.url.searchParams),
    );
  }

  /**
   * Check filter type
   * @param {object} $filter - DOM element
   * @returns {string} - filter type
   * @example
   * Filter.__checkFilterType(document.querySelector('[data-filter="example"]'));
   */
  static _checkFilterType($filter) {
    const tagName = $filter.tagName.toLowerCase();
    let filterType = null;

    if (tagName === 'select') {
      filterType = $filter.multiple ? 'select-multiple' : 'select-single';
    } else if (tagName === 'input') {
      filterType = $filter.type;
    }

    return filterType;
  }

  /**
   * Parse URLSearchParam
   * @private
   * @param {object} urlParams - URLSearchParam prototype
   * @returns {object} - {
   *  filter-type: ['filter-value'],
   * }
   */
  _parseFiltersFromUrl(urlParams) {
    const params = [...urlParams.entries()];
    const objectFilters = {};

    if (params.length === 0) return objectFilters;

    params.forEach((param) => {
      const type = param[0];
      const VALUES = param[1];
      const isFilterExist = document.querySelector(`[${this.filterAttr}="${type}"]`);

      if (!isFilterExist) return;

      objectFilters[type] = VALUES.split(' ');
    });

    return objectFilters;
  }

  /**
   * Update url & urlFilters
   * @private
   */
  _updateUrl() {
    this.url = new URL(window.location.href);
    this.urlFilters = new URLSearchParams(this.url.searchParams);
  }

  /**
   * Update DOM elements filters from url
   * @private
   * @param {object} urlParams - URLSearchParam prototype
   */
  _updateFiltersFromUrl(urlParams) {
    const objectFilters = this._parseFiltersFromUrl(urlParams);

    if (Object.keys(objectFilters).length === 0) return;

    Object.keys(objectFilters).forEach((type) => {
      const $filter = this.$form.querySelector(`[${this.filterAttr}="${type}"]`);

      if (!$filter) return;

      const filterType = Filter._checkFilterType($filter);

      switch (filterType) {
        case 'select-single':
        case 'color':
        case 'range':
        case 'date':
        case 'month':
        case 'week':
        case 'time': {
          this.$form.querySelector(`[${this.filterAttr}="${type}"]`).value = [...objectFilters[type]];
          break;
        }
        case 'select-multiple': {
          const $selectOptions = [...this.$form.querySelector(`[${this.filterAttr}="${type}"]`).options];

          $selectOptions.forEach(($selectOption) => {
            const $option = $selectOption;

            if (objectFilters[type].indexOf($option.value) >= 0) {
              $option.selected = true;
            }
          });
          break;
        }
        case 'radio': {
          this.$form.querySelector(
            `[${this.filterAttr}="${type}"][value="${[...objectFilters[type]]}"]`,
          ).checked = true;
          break;
        }
        case 'checkbox': {
          objectFilters[type].forEach((value) => {
            this.$form.querySelector(
              `[${this.filterAttr}="${type}"][value="${value}"]`,
            ).checked = true;
          });
          break;
        }
        default: {
          console.warn(`Type '${filterType}' is not yet supported.`);
          break;
        }
      }
    });
  }

  /**
   * Update url from DOM elements filters
   * @private
   * @param {object} e - DOM element event
   */
  _updateUrlFromFilters(e) {
    const $filter = e.target;
    const filterName = $filter.getAttribute(`${this.filterAttr}`);
    const filterType = Filter._checkFilterType($filter);

    switch (filterType) {
      case 'select-single':
      case 'radio':
      case 'color':
      case 'range':
      case 'date':
      case 'month':
      case 'week':
      case 'time': {
        if ($filter.value !== '') {
          this.urlFilters.set(filterName, $filter.value);
        } else {
          this.urlFilters.delete(filterName);
        }
        break;
      }
      case 'select-multiple': {
        const filterValues = [...$filter.options]
          .filter((option) => option.selected)
          .map((option) => option.value);

        this.urlFilters.set(filterName, filterValues.join(' '));
        break;
      }
      case 'checkbox': {
        const filterParams = `${this.urlFilters.get(filterName)}`.split(' ');

        if (this.urlFilters.has(filterName)) {
          if ($filter.checked) {
            this.urlFilters.set(
              filterName,
              `${this.urlFilters.get(filterName)} ${$filter.value}`,
            );
          } else if (filterParams.length > 1) {
            this.urlFilters.delete(filterName);
            filterParams.splice(filterParams.indexOf($filter.value), 1);
            this.urlFilters.set(filterName, filterParams.join(' '));
          } else {
            this.urlFilters.delete(filterName);
          }
        } else {
          this.urlFilters.append(filterName, $filter.value);
        }
        break;
      }
      default: {
        console.warn(`Type '${filterType}' is not yet supported.`);
        break;
      }
    }
  }

  /**
   * Set window location URL & update history
   * @private
   * @param {object} newUrl - URL prototype
   * @param {object} setUrlFilters - URLSearchParams prototype
   */
  _setFiltersToGlobalUrl(newUrl, setUrlFilters) {
    const updatableUrl = new URL(newUrl);

    updatableUrl.search = setUrlFilters;
    window.history.pushState(null, null, updatableUrl);

    this._updateUrl();
  }

  /**
  * Reset url & window location URL
  * @private
  */
  _resetGlobalUrl() {
    Object.keys(this._parseFiltersFromUrl(this.urlFilters)).forEach((filter) => {
      this.urlFilters.delete(filter);
    });

    this._setFiltersToGlobalUrl(this.url, this.urlFilters);
  }

  /**
  * Reset filters DOM elements
  * @private
  */
  _resetFilters() {
    this.$form.reset();
  }

  /**
  * Event listeners
  * @private
  */
  _eventListeners() {
    this.$form.querySelectorAll(`[${this.filterAttr}]`).forEach(($filter) => {
      $filter.addEventListener('change', (e) => {
        this._updateUrlFromFilters(e);
      });
    });

    window.addEventListener('popstate', () => {
      this._updateUrl();

      this._resetFilters();

      this._updateFiltersFromUrl(this.urlFilters);
    });
  }

  /**
  * Instance initialization
  * @public
  */
  initFilters() {
    this._updateFiltersFromUrl(this.urlFilters);

    this._eventListeners();
  }

  /**
  * Update DOM elements filters
  * @public
  */
  updateFilters() {
    this._updateFiltersFromUrl(this.urlFilters);
  }

  /**
  * Reset url & window location URL
  * @public
  */
  resetUrl() {
    this._resetGlobalUrl();
  }

  /**
  * Reset DOM elements filters
  * @public
  */
  resetFilters() {
    this._resetFilters();
  }

  /**
  * Set URLSearchParams to window.location
  * @public
  * @param {object} newUrl - URL prototype
  */
  setFiltersToUrl(newUrl) {
    this._setFiltersToGlobalUrl(newUrl, this.urlFilters);
  }

  /**
  * Get filters types & values
  * @public
  * @returns {object} - {
  *  filter-type: ['filter-value'],
  * }
  */
  getFiltersFromUrl() {
    return this._parseFiltersFromUrl(this.urlFilters);
  }
}

export default Filter;
