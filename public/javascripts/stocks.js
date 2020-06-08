
function displayPrice(price, priceId){
  if(price>0){
    document.getElementById(priceId).innerHTML = '= $'+price.toFixed(2);
  }
  else{
    document.getElementById(priceId).innerHTML = '';
  }
}