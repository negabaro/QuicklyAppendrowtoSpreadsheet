var app = new Vue({
  el: '#app',
  data: {
    scriptURL: '',
    spreadsheetURL: '',
    syncSheets: [],
    addedSheets: [],
    selectedSheet: {},
    isLoading: false,
    formData: { URL: '', created_at: '' },
  },
  created: function() {
    this.scriptURL = localStorage.getItem('setting.scriptURL');
    var settingSheets = JSON.parse(localStorage.getItem('setting.sheets'));

    if(settingSheets && settingSheets.length) {
      this.addedSheets = settingSheets;
      this.selectedSheet = this.addedSheets[this.addedSheets.length-1];
    }
    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
      this.formData.URL = tabs[0].url;
    });
    var now = new Date();
    this.formData.created_at = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()}`;
  },
  methods: {
    sync: function() {
      this.isLoading = true;
      if(!this.scriptURL || !this.spreadsheetURL) {
        return false;
      }
      const params = new URLSearchParams();
      params.set('spreadsheetURL', this.spreadsheetURL);
      fetch(this.scriptURL + '?' + params.toString()).then(response => {
        this.isLoading = false;
        return response.json()
      }).then(json => {
        var settingSheets = JSON.parse(localStorage.getItem('setting.sheets'));
        this.syncSheets = json.data.map(sheet => {
          if(settingSheets && settingSheets.some(settingSheet => {
            return settingSheet.spreadsheetURL === sheet.spreadsheetURL 
                    && settingSheet.sheetId === sheet.sheetId
          })) {
            sheet.added = true;
          } else {
            sheet.added = false;
          }
          return sheet;
        });
      }).catch(e => {
        UIkit.notification(e, {status:'danger', pos: 'bottom-left'})
        this.isLoading = false;
      }) 
    },
    postData: function() {
      this.isLoading = true;
      fetch(this.scriptURL, {
        method: 'POST',
        body : JSON.stringify({ 
          spreadsheetURL : this.selectedSheet.spreadsheetURL, 
          sheetName : this.selectedSheet.sheetName,
          data: this.formData }),
        headers : new Headers({ "Content-type" : "application/json" })
      }).then(response => {
        UIkit.notification("🎉Done!", {status:'success', timeout: 3000, pos: 'bottom-left'})
        this.isLoading = false;
      }).catch(e => {
        UIkit.notification(e, {status:'danger', pos: 'bottom-left'})
        this.isLoading = false;
      }) 
    },
    setScriptURL: function() {
      localStorage.setItem('setting.scriptURL', this.scriptURL);
      UIkit.notification("🎉Done!", {status:'success', timeout: 3000, pos: 'bottom-left'})
    },
    addSheet: function(sheet) {
      this.addedSheets.push(sheet);
      this.selectedSheet = this.addedSheets[this.addedSheets.length-1];
      localStorage.setItem('setting.sheets', JSON.stringify(this.addedSheets));
      UIkit.notification("🎉Done!", {status:'success', timeout: 3000, pos: 'bottom-left'})
    },
    updateSheet: function(sheet) {
      var selectedSheetIndex;
      this.addedSheets = this.addedSheets.map((addedSheet, index) => {
        if(addedSheet.spreadsheetURL === sheet.spreadsheetURL 
          && addedSheet.sheetId === sheet.sheetId) {
          selectedSheetIndex = index;
          return sheet;
        }
        return addedSheet;
      })
      console.log(this.addedSheets)
      this.selectedSheet = this.addedSheets[selectedSheetIndex];
      localStorage.setItem('setting.sheets', JSON.stringify(this.addedSheets));
      UIkit.notification("🎉Done!", {status:'success', timeout: 3000, pos: 'bottom-left'})
    },
    removeSheet: function(sheet) {
      var result = confirm( "Remove this sheet?" );
      if(result) {
        this.addedSheets = this.addedSheets.filter(addedSheet => {
          return !(addedSheet.spreadsheetURL === sheet.spreadsheetURL && addedSheet.sheetId === sheet.sheetId);
        });
        localStorage.setItem('setting.sheets', JSON.stringify(this.addedSheets));
        if(this.addedSheets.length) {
          this.selectedSheet = this.addedSheets[0]
        }
      }
    },
    getSheetURL: function(sheet) {
      if(!sheet) {
        return '';
      }
      return sheet.spreadsheetURL.slice(0, -1) + sheet.sheetId;
    },
  }
})