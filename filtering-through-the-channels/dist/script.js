const applyFilterButton = document.getElementById('apply-filter');
const filterImage = document.getElementById('filter-image');
let filterOn = false;
applyFilterButton.addEventListener('click', () => {
  filterOn = !filterOn;
  if (filterOn) {
    filterImage.classList.add('filtered');
    applyFilterButton.textContent = 'Turn off';
  } else {
    filterImage.classList.remove('filtered');
    applyFilterButton.textContent = 'Turn on';
  }
});