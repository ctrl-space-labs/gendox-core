export const formatDocumentTitle = (remoteUrl) => {
  if (!remoteUrl) return "";

  const fileName = remoteUrl.split("/").pop();
  let cleanName = fileName.split(".").slice(0, -1).join(".");
  cleanName = cleanName.replace(/[_-]/g, " ");
  cleanName = cleanName.replace(/^\d+\.\s+-?/, "");
  cleanName = cleanName.replace(/\b\w/g, (char) => char.toUpperCase());

  return cleanName;
};

// export default formatDocumentTitle;
