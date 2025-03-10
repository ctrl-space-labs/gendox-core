// Desc: Utility functions for ordering arrays of objects by a field
export const sortByField = (array, field, activeId = null) => {
  const arrayCopy = [...array]; 

    return arrayCopy.sort((a, b) => {
      // If there's an activeId, prioritize it at the top
      if (activeId) {
        if (a.id === activeId) return -1;
        if (b.id === activeId) return 1;
      }
      // Continue sorting by the specified field if no activeId match
      if (a[field] && b[field]) {
        return a[field].localeCompare(b[field]);
      }
      return 0;
    });
  };