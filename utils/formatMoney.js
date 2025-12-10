export const formatMoney = (amount) => {
  if (amount == null || isNaN(amount)) return '₮0';
  
  return '₮' + Number(amount).toLocaleString('en-US');
};