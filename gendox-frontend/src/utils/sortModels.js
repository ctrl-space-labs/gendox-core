export const sortModels = (models) => {
    // Create a shallow copy of the array to avoid mutation of the original
    const modelsCopy = [...models];
    return modelsCopy.sort((a, b) => {
      const providerA = a.aiModelProvider?.name || '';
      const providerB = b.aiModelProvider?.name || '';
      if (providerA === providerB) {
        return a.name.localeCompare(b.name); // Sort by name if provider is the same
      }
      return providerA.localeCompare(providerB); // Otherwise, sort by provider name
    });
  }