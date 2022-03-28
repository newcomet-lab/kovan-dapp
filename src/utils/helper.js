import { BigNumber } from 'ethers';

export const getNumberFromStrBN = (str_bn, dec) => {
    let val = 0;
    for (let i = 0; i < str_bn.length; i++) {
        if (str_bn.substr(str_bn.length - 1 - i, 1) !== '0') {
            val = parseInt(str_bn.substr(0, str_bn.length - i)) / Math.pow(10, dec - i);
            break;
        }
    }
    return val;
};
 
export const getNumberFromBN = (bn, d) => {
    const num1 = BigNumber.from(bn)
    const num2 = BigNumber.from(10).pow(d);
    const num3 = num1.mod(num2);
    const num4 = num1.sub(num3).div(num2);
    return num4.toNumber() + getNumberFromStrBN(num3.toString(), d);
}

export const getBNFromNumber = (num, d) => {
    return BigNumber.from(parseInt(num)).mul(BigNumber.from(10).pow(d)).add(((num - parseInt(num)) * Math.pow(10, d)).toString());
}

export const formatNumberFromBN = (bn, d) => {
    const str = (getNumberFromBN(bn, d)).toFixed(6).replace(/\.0+$/, '');
//    const str = (getNumberFromBN(bn, d)).toString().replace(/\.0+$/, '');
    const str1 = str.split(".")[0];
    const str2 = str.split(".")[1] ? "." + str.split(".")[1] : '';
    return str1.split("").reverse().reduce(function(acc, num, i, orig) {return num + (num !== "-" && i && !(i % 3) ? "," : "") + acc;}, "") + str2;
}
