const generateUserId = () => {
    const min = 1000;
    const max = 9999;
    const randomNum = Math.floor(Math.random() * (max - min + 1) + min);
    return randomNum.toString();
}

const generateEmailId = () => {
    const domain = "formbricks.test";
    const randomString = Math.random().toString(36).substring(2);
    const emailId = `${randomString}@${domain}`;
    return emailId;
};

const generateRandomString = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const maxLength = 8;

    let randomString = "";
    for (let i = 0; i < maxLength; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }
    return randomString;
};

export const constants = {
    environmentId: "take-this-from-gh-actions-env",
    apiHost: "https://app.formbricks.com",
    initialUserId: generateUserId(),
    initialUserEmail: generateEmailId(),
    updatedUserEmail: generateEmailId(),
    customAttributeKey: generateRandomString(),
    customAttributeValue: generateRandomString(),
} as const;
