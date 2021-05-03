import 'alpinejs';
import axios from 'axios';
import 'regenerator-runtime/runtime';

window.DATATABLE = () => {
  return {
    loading: false,
    headings: [
      {
        'key': 'first_name',
        'value': 'First Name',
        'order': '',
        'sort': true
      }, {
        'key': 'last_name',
        'value': 'Last Name',
        'order': '',
        'sort': true
      }, {
        'key': 'email',
        'value': 'Email',
        'order': '',
        'sort': true
      }, {
        'key': 'gender',
        'value': 'Gender',
        'order': '',
        'sort': true
      }, {
        'key': 'ip_address',
        'value': 'IP Address',
        'order': '',
        'sort': true
      }, {
        'key': 'actions',
        'value': 'Actions',
        'order': '',
        'sort': false
      }
    ],
    tableData: [],
    total: 10,
    totalCount: null,
    currentPage: 1,
    page: 1,
    pageSize: 10,
    paginationSizes: [10, 20, 25, 30, 40, 50, 100],
    pagination: {
      showPrevMore: false,
      showNextMore: false,
      pagerCount: 7,
      pageCount: null,
      internalPageSize: 10,
      internalCurrentPage: 1,
      lastEmittedPage: -1
    },
    searchFilter: '',
    timeout: null,
    sortingProp: [],
    sortingOrder: [],
    sortOrders: ['asc', 'desc', null],
    selectedRows: [],
    get internalPageCount() {
      if (typeof this.total === 'number') {
        return Math.max(1, Math.ceil(this.total / this.pagination.internalPageSize));
      } else if (typeof this.pagination.pageCount === 'number') {
        return Math.max(1, this.pagination.pageCount);
      }
      return null;
    },
    getData({ page, limit, query, sortingProp, sortingOrder, search }) {
      const parameters = {
        _page: page,
        _limit: limit,
        _sort: sortingProp,
        _order: sortingOrder,
        q: search
      };
      return axios.get('http://localhost:9993/users', {
        params: parameters
      })
      .then(({ data }) => {
        return data;
      })
      .catch((error) => {
        console.log(error);
      });
    },
    async getTableData( page, limit ) {
      this.loading = true;
      const reqPage = page || this.currentPage;
      const reqLimit = limit || this.pageSize;
      try {
        const response = await this.getData({
          page: reqPage,
          limit: reqLimit,
          sortingProp: this.sortingProp,
          sortingOrder: this.sortingOrder,
          search: this.searchFilter
        });
        setTimeout( () => {
          this.tableData = response.data;
        }, 500 );
        this.total = response.total
        this.totalCount = this.total;
        this.pagination.pageCount = this.internalPageCount;
      } finally {
        setTimeout( () => {
          this.loading = false;
        }, 500 );
      }
    },
    toggleOrder({ order }) {
      if (order === '') return this.sortOrders[0];
      const index = this.sortOrders.indexOf(order || null);
      return this.sortOrders[index > this.sortOrders.length - 2 ? 0 : index + 1];
    },
    handleHeaderClick( event, column, rowIndex, givenOrder ) {

      let order = this.toggleOrder(column);
      console.log( this.headings, 'column', column, 'event', event.target);
      if ( !column.sort ) {
        return
      }

      let sortOrder;
      const unsortingColumns = this.headings.filter(function(x) { return x !== column; });
      const sortingColumn = unsortingColumns.forEach( column => {
        column.order = null;
      });

      if (!order) {
        sortOrder = column.order = null;
      } else {
        sortOrder = column.order = order;
      }

      this.handleSorting( column );
    },
    handleSorting({ key, order }) {
      if ( order !== null ) {
        this.sortingProp = key;
        this.sortingOrder = order;
      } else {
        this.sortingProp = [];
        this.sortingOrder = [];
      }
      this.getTableData();
    },
    getHeaderClass( event, column ) {
      const classes = [column.key, column.order]

      if ( column.sort ) {
        classes.push('is-sortable');
      }

      return classes.join(' ');
    },
    search( event ) {
      const keyCodes = [9, 13, 16, 17, 18, 20, 37, 38, 39, 40, 91, 116, 224];

      clearTimeout( this.timeout );
      this.timeout = setTimeout( () => {
        if ( keyCodes.indexOf( event.keyCode ) < 0 ) {
          this.getTableData();
        }
      }, 300 );
    },
    changeView( event ) {
      this.pagination.internalPageSize = event = parseInt(event, 10);
      this.emitChange();
    },
    changePage( event ) {
      this.pagination.internalCurrentPage = this.getValidCurrentPage(event);
      this.emitChange();
    },
    emitChange() {
      this.$nextTick(() => {
        if (this.pagination.internalCurrentPage !== this.pagination.lastEmittedPage || this.pagination.internalPageSize) {
          this.getValidCurrentPage( this.pagination.internalCurrentPage )
          this.pagination.lastEmittedPage = this.pagination.internalCurrentPage;
          this.getTableData();
        }
      });
    },
    getValidCurrentPage( value ) {
      value = parseInt(value, 10);

      const havePageCount = typeof this.internalPageCount === 'number';

      let resetValue;
      if (!havePageCount) {
        if (isNaN(value) || value < 1) resetValue = 1;
      } else {
        if (value < 1) {
          resetValue = 1;
        } else if (value > this.internalPageCount) {
          resetValue = this.internalPageCount;
        }
      }

      if (resetValue === undefined && isNaN(value)) {
        resetValue = 1;
      } else if (resetValue === 0) {
        resetValue = 1;
      }

      if ( resetValue != undefined ) {
        this.setInternalPageCount(resetValue);
      }

      return resetValue === undefined ? value : resetValue;
    },
    onPagerClick( event ) {
      const target = event.target;
      if ( target.tagName === 'UL' ) {
        return;
      }
      let newPage = Number(event.target.textContent);
      const pageCount = this.pageCount;
      const currentPage = this.currentPage;
      const pagerCountOffset = this.pagerCount - 2;

      if (target.className.indexOf('more') !== -1) {
        if (target.className.indexOf('quickprev') !== -1) {
          newPage = currentPage - pagerCountOffset;
        } else if (target.className.indexOf('quicknext') !== -1) {
          newPage = currentPage + pagerCountOffset;
        }
      }

      if (!isNaN(newPage)) {
        if (newPage < 1) {
          newPage = 1;
        }
        if (newPage > pageCount) {
          newPage = pageCount;
        }
      }
      if (newPage !== currentPage) {
        this.changePage( newPage );
      }
    },
    pagers() {
      const pagerCount = this.pagination.pagerCount;
      const halfPagerCount = ( pagerCount - 1 ) / 2;

      const currentPage = Number(this.currentPage);
      const pageCount = Number(this.pagination.pageCount);

      let showPrevMore = false;
      let showNextMore = false;

      if (pageCount > pagerCount) {
        if (currentPage > pagerCount - halfPagerCount) {
          showPrevMore = true;
        }
        if (currentPage < pageCount - halfPagerCount) {
          showNextMore = true;
        }
      }

      const array = [];

      if (showPrevMore && !showNextMore) {
        const startPage = pageCount - (pagerCount - 2);
        for (let i = startPage; i < pageCount; i++) {
          array.push(i);
        }
      } else if (!showPrevMore && showNextMore) {
        for (let i = 2; i < pagerCount; i++) {
          array.push(i);
        }
      } else if (showPrevMore && showNextMore) {
        const offset = Math.floor(pagerCount / 2) - 1;
        for (let i = currentPage - offset ; i <= currentPage + offset; i++) {
          array.push(i);
        }
      } else {
        for (let i = 2; i < pageCount; i++) {
          array.push(i);
        }
      }
      this.pagination.showPrevMore = showPrevMore;
      this.pagination.showNextMore = showNextMore;

      return array;
    },
    setInternalPageCount( newVal ) {
      const oldPage = this.pagination.internalCurrentPage;
      if (newVal > 0 && oldPage === 0) {
        this.pagination.internalCurrentPage = 1;
      } else if (oldPage > newVal) {
        this.pagination.internalCurrentPage = newVal === 0 ? 1 : newVal;
      }
    },
    handleAction( e ) {
      alert( e.first_name );
    },
    selectAllCheckbox( e ) {
      let columns = document.querySelectorAll('.rowCheckbox');

      this.selectedRows = [];

      if (e.target.checked == true) {
        columns.forEach(column => {
          column.checked = true
          this.selectedRows.push(column.name)
        });
      } else {
        columns.forEach(column => {
          column.checked = false
        });
        this.selectedRows = [];
      }
    },
    getRowDetail( e, item ) {
      let rows = this.selectedRows;

      if (rows.includes(item)) {
        let index = rows.indexOf(item);
        rows.splice(index, 1);
      } else {
        rows.push(item);
      }
    },
    toggleColumn( key ) {
      let columns = document.querySelectorAll('.' + key);

      if (this.$refs[key].classList.contains('hide') && this.$refs[key].classList.contains(key)) {
        columns.forEach(column => {
          column.classList.remove('hide');
        });
      } else {
        columns.forEach(column => {
          column.classList.add('hide');
        });
      }
    },
    isEmpty() {
      return this.pagination.pageCount ? false : true
    },
    watchers() {
      this.getTableData();

      this.$watch('currentPage', value => {
        this.internalCurrentPage = this.getValidCurrentPage(value);
        this.page = this.internalCurrentPage;
      });

      this.$watch('pageSize', value => {
        this.pagination.internalPageSize = isNaN(value) ? 10 : value;
      });

      this.$watch('pagination.internalCurrentPage', value => {
        this.currentPage = value;
        this.pagination.lastEmittedPage = -1;
      });
    }
  }
}