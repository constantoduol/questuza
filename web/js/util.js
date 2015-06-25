App.prototype.formatMoney = function (num) {
    num = parseFloat(num);
    var p = num.toFixed(2).split(".");
    var chars = p[0].split("").reverse();
    var newstr = '';
    var count = 0;
    for (var x in chars) {
        count++;
        if (count % 3 === 1 && count !== 1 && chars[x] !== "-") {
            newstr = chars[x] + ',' + newstr;
        } else {
            newstr = chars[x] + newstr;
        }
    }
    return newstr + "." + p[1];
};