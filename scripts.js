document.addEventListener('DOMContentLoaded', async () => {
    const filterContainer = document.getElementById('filterContainer');
    const filterForm = document.createElement('form');
    filterForm.id = 'filterForm';
    const resultsHeader = document.getElementById('resultsHeader');
    const resultsTableBody = document.getElementById('resultsTableBody');
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const overlay = document.getElementById('modalOverlay');
    const columnsContainer = document.getElementById('columnsContainer');
    const applySettingsButton = document.getElementById('applySettingsButton');
    const selectAll = document.getElementById('selectAll');
    const deselectAll = document.getElementById('deselectAll');
  
    let filterFields;
  
    try {
      // Fetch the filters JSON file
      const response = await fetch('./filters.json');
      if (!response.ok) {
        throw new Error('Failed to load filters.json');
      }
  
      filterFields = await response.json();
  
      if (filterFields && filterFields.filters) {
        // Generate filter form elements
        filterFields.filters.forEach(filter => {
          let filterElement;
  
          if (filter.type === 'dropdown') {
            filterElement = document.createElement('select');
            filterElement.id = filter.fieldName;
            filterElement.name = filter.fieldName;
            filterElement.className = 'form-select mb-3';
  
            filter.options.forEach(option => {
              const opt = document.createElement('option');
              opt.value = option;
              opt.textContent = option;
              filterElement.appendChild(opt);
            });
          } else if (filter.type === 'text' || filter.type === 'number') {
            filterElement = document.createElement('input');
            filterElement.type = filter.type === 'number' ? 'number' : 'text';
            filterElement.id = filter.fieldName;
            filterElement.name = filter.fieldName;
            filterElement.className = 'form-control mb-3';
          } else if (filter.type === 'date') {
            filterElement = document.createElement('input');
            filterElement.type = 'date';
            filterElement.id = filter.fieldName;
            filterElement.name = filter.fieldName;
            filterElement.className = 'form-control mb-3';
          } else if (filter.type === 'toggle') {
            filterElement = document.createElement('input');
            filterElement.type = 'checkbox';
            filterElement.id = filter.fieldName;
            filterElement.name = filter.fieldName;
            filterElement.className = 'form-check-input mb-3';
  
            const label = document.createElement('label');
            label.htmlFor = filter.fieldName;
            label.className = 'form-check-label ms-2';
            label.textContent = filter.displayName;
  
            filterForm.appendChild(filterElement);
            filterForm.appendChild(label);
            filterForm.appendChild(document.createElement('br'));
          }
  
          if (filterElement && filter.type !== 'toggle') {
            const label = document.createElement('label');
            label.htmlFor = filter.fieldName;
            label.className = 'form-label';
            label.textContent = filter.displayName;
  
            filterForm.appendChild(label);
            filterForm.appendChild(filterElement);
          }
        });
  
        const filterButton = document.createElement('button');
        filterButton.type = 'button';
        filterButton.className = 'btn btn-primary';
        filterButton.textContent = 'Filter';
        filterButton.id = 'filterButton';
  
        filterForm.appendChild(filterButton);
        filterContainer.appendChild(filterForm);
  
        // Add event listener to the filter button after it has been added to the DOM
        filterButton.addEventListener('click', async () => {
          const query = new URLSearchParams();
  
          filterFields.filters.forEach(filter => {
            const fieldElement = document.getElementById(filter.fieldName);
            if (fieldElement) {
              if (filter.type === 'toggle') {
                if (fieldElement.checked) {
                  query.append(filter.fieldName, 'true');
                }
              } else if (fieldElement.value && fieldElement.value !== 'All') {
                query.append(filter.fieldName, fieldElement.value);
              }
            }
          });
  
          try {
            // Make the API request to the Heroku backend
            const response = await fetch(`https://cu-schedule-backend-21a7c769f4d0.herokuapp.com/classes/search?${query.toString()}`);
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
  
            const data = await response.json();
            populateResultsTable(data);
          } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
          }
        });
  
        // Initialize column visibility settings
        initializeColumnSettings(filterFields.filters);
      } else {
        console.error("Filter fields not found or improperly formatted.");
      }
    } catch (error) {
      console.error('There was a problem loading the filter fields:', error);
    }
  
    // Function to initialize column visibility settings modal
    function initializeColumnSettings(filters) {
      if (columnsContainer) {
        columnsContainer.innerHTML = '';
  
        filters.forEach(filter => {
          const div = document.createElement('div');
          div.className = 'column-box';
          div.style.flex = '1 1 calc(16% - 10px)';
          div.style.border = '1px solid #ddd';
          div.style.padding = '10px';
          div.style.borderRadius = '8px';
          div.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
          div.style.backgroundColor = '#f9f9f9';
          div.style.cursor = 'pointer';
          div.style.textAlign = 'center';
          div.style.userSelect = 'none';
          div.dataset.selected = localStorage.getItem(`column-${filter.fieldName}`) === 'false' ? 'false' : 'true';
          div.dataset.fieldName = filter.fieldName;
          div.textContent = filter.displayName;
  
          div.addEventListener('click', () => {
            div.dataset.selected = div.dataset.selected === 'true' ? 'false' : 'true';
            updateBoxStyles();
          });
  
          columnsContainer.appendChild(div);
        });
      }
    }
  
    // Function to populate the results table
    function populateResultsTable(data) {
      if (resultsTableBody && resultsHeader) {
        resultsTableBody.innerHTML = '';
        resultsHeader.innerHTML = '';
  
        // Generate table headers dynamically based on localStorage settings
        filterFields.filters.forEach(filter => {
          const th = document.createElement('th');
          th.textContent = filter.displayName;
          th.id = `header-${filter.fieldName}`;
  
          // Set initial visibility based on localStorage
          const isVisible = localStorage.getItem(`column-${filter.fieldName}`) !== 'false';
          th.style.display = isVisible ? '' : 'none';
  
          resultsHeader.appendChild(th);
        });
  
        // Populate the table with data and apply visibility settings
        data.forEach(course => {
          const row = document.createElement('tr');
          filterFields.filters.forEach(filter => {
            const cell = document.createElement('td');
            cell.textContent = course[filter.fieldName] !== undefined ? course[filter.fieldName] : '';
            cell.className = `cell-${filter.fieldName}`;
  
            // Set initial visibility based on localStorage
            const isVisible = localStorage.getItem(`column-${filter.fieldName}`) !== 'false';
            cell.style.display = isVisible ? '' : 'none';
  
            row.appendChild(cell);
          });
          resultsTableBody.appendChild(row);
        });
      }
    }
  
    // Initial rendering of column headers based on visibility in localStorage
    function initializeColumnHeaders() {
      if (resultsHeader) {
        resultsHeader.innerHTML = '';
  
        filterFields.filters.forEach(filter => {
          const th = document.createElement('th');
          th.textContent = filter.displayName;
          th.id = `header-${filter.fieldName}`;
  
          // Set initial visibility based on localStorage
          const isVisible = localStorage.getItem(`column-${filter.fieldName}`) !== 'false';
          th.style.display = isVisible ? '' : 'none';
  
          resultsHeader.appendChild(th);
        });
      }
    }
  
    // Call initializeColumnHeaders when DOM is fully loaded to ensure headers reflect visibility settings
    initializeColumnHeaders();
  
    // Show settings modal and overlay
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        if (settingsModal && overlay) {
          settingsModal.style.display = 'block';
          overlay.style.display = 'block';
          updateBoxStyles();
        } else {
          console.error('Modal or overlay not found');
        }
      });
    }
  
    // Close modal when clicking on the overlay
    if (overlay) {
      overlay.addEventListener('click', () => {
        if (settingsModal) {
          settingsModal.style.display = 'none';
        }
        overlay.style.display = 'none';
      });
    }
  
    // Close modal when clicking on the close button
    const closeButton = settingsModal ? settingsModal.querySelector('.close-modal-button') : null;
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        if (settingsModal) {
          settingsModal.style.display = 'none';
        }
        overlay.style.display = 'none';
      });
    }
  
    // Function to update box styles
    function updateBoxStyles() {
      const boxes = document.querySelectorAll('.column-box');
      boxes.forEach(box => {
        if (box.dataset.selected === 'true') {
          box.style.backgroundColor = '#007bff';
          box.style.color = '#fff';
        } else {
          box.style.backgroundColor = '#f9f9f9';
          box.style.color = '#000';
        }
      });
    }
  
    // Function to apply column visibility settings
    if (applySettingsButton) {
      applySettingsButton.addEventListener('click', () => {
        const boxes = document.querySelectorAll('.column-box');
        boxes.forEach(box => {
          const fieldName = box.dataset.fieldName;
          const th = document.getElementById(`header-${fieldName}`);
          const cells = document.querySelectorAll(`.cell-${fieldName}`);
          const isVisible = box.dataset.selected === 'true';
  
          // Store the visibility state in localStorage
          localStorage.setItem(`column-${fieldName}`, isVisible);
  
          if (isVisible) {
            if (th) th.style.display = '';
            cells.forEach(cell => cell.style.display = '');
          } else {
            if (th) th.style.display = 'none';
            cells.forEach(cell => cell.style.display = 'none');
          }
        });
  
        // Close the modal after applying changes
        settingsModal.style.display = 'none';
        overlay.style.display = 'none';
      });
    }
  
    // Add functionality to select all and deselect all buttons
    if (selectAll) {
      selectAll.addEventListener('click', () => {
        const boxes = document.querySelectorAll('.column-box');
        boxes.forEach(box => {
          box.dataset.selected = 'true';
        });
        updateBoxStyles();
      });
    }
  
    if (deselectAll) {
      deselectAll.addEventListener('click', () => {
        const boxes = document.querySelectorAll('.column-box');
        boxes.forEach(box => {
          box.dataset.selected = 'false';
        });
        updateBoxStyles();
      });
    }
  });
