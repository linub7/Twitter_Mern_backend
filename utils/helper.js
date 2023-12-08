exports.removeDuplicateStrings = (arr) => {
  const uniqueArr = [];
  const seen = {};

  for (const item of arr) {
    if (!seen[item]) {
      uniqueArr.push(item);
      seen[item] = true;
    }
  }

  return uniqueArr;
};
