export const truncate = (str: string | undefined, pre: number, post?: number) => {
  if (!str) {
    return "";
  }
  const _post = post || 0;
  const len = pre + _post;
  if (str.length <= len) {
    return str;
  }
  return `${str.substring(0, pre)}...${post ? str.substring(str.length - post) : ""}`;
};

export const getFromLocalStorageTxList = () => {
  const txListString = window.localStorage.getItem("txList");
  let txList;
  if (!txListString) {
    txList = [];
  } else {
    txList = JSON.parse(txListString);
  }
  txList = txList.filter((tx: string) => typeof tx === "string");
  return txList as string[];
};

export const addToLocalStorageTxList = (hash: string) => {
  const txList = getFromLocalStorageTxList();
  txList.push(hash);
  window.localStorage.setItem("txList", JSON.stringify(txList));
};
