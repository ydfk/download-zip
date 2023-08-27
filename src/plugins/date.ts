/*
 * @Description: Copyright (c) ydfk. All rights reserved
 * @Author: ydfk
 * @Date: 2023-08-27 20:45:59
 * @LastEditors: ydfk
 * @LastEditTime: 2023-08-27 20:46:48
 */
export const getNowDayStr = () => {
  // 创建一个新的 Date 对象，表示当前时间
  const currentDate = new Date();

  // 获取年、月、日
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // 月份从0开始，因此需要+1
  const day = String(currentDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
