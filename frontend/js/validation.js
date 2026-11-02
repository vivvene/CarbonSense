function isValidNumber(value) {
    return Number.isFinite(value) && value >= 0;
}

function isValidCount(value) {
    return isValidNumber(value) && Number.isInteger(value);
}

function isValidDays(value) {
    return isValidNumber(value) && value >= 0 && value <= 31;
}