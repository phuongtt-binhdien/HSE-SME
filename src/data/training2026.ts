// Danh sách huấn luyện ATVSLĐ năm 2026 — Công ty CP Phân bón Bình Điền (Nhà máy Long An).
// Nguồn: DS HL ATVSLĐ nhóm 4 (Công ty, 02/10/2026), nhóm 4 (Nhà máy, 12/10/2026), nhóm 5 (06/10/2026), nhóm 6 (02/10/2026).
// Ký duyệt: P.TGĐ Võ Văn Phu, TP. Kỹ thuật Võ Anh Tuấn, người lập Nguyễn Thị Huyền Trân.
// Dữ liệu cá nhân: chỉ lưu họ tên, năm sinh, bộ phận — không lưu số CCCD và ngày sinh đầy đủ.

export interface Session { id: string; group: number; title: string; date: string; time: string; scope: string }
export interface Trainee { s: string; name: string; born: number | null; dept: string; unit: string }

export const SESSIONS: Session[] = [
  { id: "n4-cty", group: 4, title: "Huấn luyện ATLĐ chung — nhóm 4", date: "2026-10-02", time: "13h00–15h00", scope: "Khối văn phòng Công ty" },
  { id: "n4-nm",  group: 4, title: "Huấn luyện ATLĐ chung — nhóm 4", date: "2026-10-12", time: "8h00–11h00 hoặc 13h00–15h00", scope: "Nhà máy" },
  { id: "n5",     group: 5, title: "Huấn luyện ATLĐ — nhóm 5", date: "2026-10-06", time: "8h00–11h00", scope: "Phòng Tổng hợp" },
  { id: "n6",     group: 6, title: "Huấn luyện an toàn vệ sinh viên — nhóm 6", date: "2026-10-02", time: "8h00–11h00", scope: "An toàn vệ sinh viên các bộ phận" },
];

// "Họ tên|năm sinh" theo từng [phiên, đơn vị, bộ phận]
const RAW: [string, string, string, string][] = [
  ["n5", "Phòng Tổng hợp", "Phòng Tổng hợp", "Đặng Thu Thảo|1980;Phạm Phát Đạt|1992;Phạm Thị Mỹ Phụng|1992"],

  ["n6", "Nhà máy", "Sản xuất", "Mai Thành Kính|1983;Hứa Văn Vui|1983;Tô Văn Tánh|1982;Huỳnh Quốc Điều|1987;Kiều Thanh Truyền|1988;Trương Văn Tám|1970;Lê Thanh Tuyên|1979;Hoàng Văn Dững|1968;Phạm Trường Giang|1971;Tạ Ánh Dương|1972;Nguyễn Thanh Thiệp|1987;Lê Văn Lẩm|1972;Cao Văn Hiên|1976"],
  ["n6", "Nhà máy", "Xử lý nguyên liệu", "Nguyễn Văn Vũ|1976"],
  ["n6", "Nhà máy", "Vệ sinh công nghiệp", "Võ Đình Chinh|1966;Ngô Văn Chính|1971"],
  ["n6", "Nhà máy", "Cấp dưỡng", "Lê Thị Phương Lan|1985"],
  ["n6", "Nhà máy", "Cơ điện", "Nguyễn Bảo Dương|1985;Nguyễn Hữu Kiên|1981"],
  ["n6", "Nhà máy", "Xe nâng", "Nguyễn Xuân Trường|1975"],
  ["n6", "Nhà máy", "Lồng bao", "Trần Văn Niên|1973"],
  ["n6", "Nhà máy", "Kho TP", "Nguyễn Hoàng Phong|1978"],
  ["n6", "Nhà máy", "Bảo vệ", "Lê Xuân Hòa|1975;Lê Văn Dũng|1970;Lê Hoàng Nam|1980"],
  ["n6", "Nhà máy", "Nghiệp vụ", "Bùi Thị Thanh Lan|1986"],
  ["n6", "Nhà máy", "Điều hành", "Nguyễn Thị Hường|1992"],
  ["n6", "Công ty", "Phòng Vật tư", "Lâm Sơn Cao|1972"],
  ["n6", "Công ty", "Phòng QM", "Đỗ Ngọc Quyên Anh|2000"],
  ["n6", "Công ty", "Phòng Tổng hợp", "Đặng Thu Thảo|1980"],
  ["n6", "Công ty", "Phòng Nghiên cứu", "Trương Minh Tường|1989"],
  ["n6", "Công ty", "Phòng Kỹ thuật", "Nguyễn Viết Thắng|1977"],
  ["n6", "Công ty", "Phòng Marketing", "Phạm Thị Thu|1974"],
  ["n6", "Công ty", "Phòng Kinh doanh", "Lê Đình Toàn|1986"],
  ["n6", "Công ty", "Phòng Kế toán", "Bùi Hoài Phương|1984"],

  ["n4-cty", "Công ty", "Phòng Tổng hợp", "Trương Thị Bích Phương|1970;Cao Xuân Tiến|1974;Nguyễn Hữu Dũng|1983;Phan Thị Tuyền|1987;Mai Đông Giang|1980;Nguyễn Minh Tuấn|1985;Cái Tấn Phú|1989;Trần Đình Quang|1973;Cái Tấn Kia|1965;Nguyễn Trọng Trung|1966;Nguyễn Văn Thủ|1984;Nguyễn Thanh Bình|1971;Hồ Hoàng Vĩnh|1978;Lê Nguyên Khang|1986;Trần Đình Nam|1982;Phan Thanh Hùng|1977;Trần Đức Hoa|1977;Thái Quan Sang|1975;Lê Đặng Trí Dũng|1966;Lê Hoàng Đức|1965;Ngô Văn Cường|1979;Lê Hữu Nghĩa|1967;Dương Ngọc Trúc Linh|1981;Trần Ngọc Nhiều|1974;Võ Văn Đông|1979"],
  ["n4-cty", "Công ty", "Nhóm Dịch vụ", "Nguyễn Trọng Lý|1968;Vũ Văn Anh|1962;Huỳnh Văn Đạt|1954;Nguyễn Thiên Cảnh|1967;Nguyễn Trường Sơn|1978;Nguyễn Văn Rì|"],
  ["n4-cty", "Công ty", "Phòng Nghiên cứu", "Phạm Anh Cường|1966;Đào Thanh Liêm|1991;Lê Thị Ngọc Loan|1979;Trương Minh Tường|1989;Cái Tấn Phúc|1995;Vũ Thị Thêu|1985"],
  ["n4-cty", "Công ty", "Phòng Kỹ thuật SX", "Hoàng Lâm|1982;Trần Lê Triều Thy|1981;Huỳnh Thanh Liêm|1977;Phạm Minh Hoàng|1981;Nguyễn Minh Tâm|1980;Nguyễn Hữu Thông|1978;Trần Trường Lộc|1975;Nguyễn Anh Đức|2003"],
  ["n4-cty", "Công ty", "Phòng Marketing", "Nguyễn Xuân Thắng|1985;Nguyễn Thùy Mai|1982;Trần Thị Ngọc Vân|1980;Phan Quốc Nam|1978;Lê Thanh Hòa|2000;Nguyễn Quốc Khánh|1995;Dương Khánh Duy|1989;Trần Tấn Thành|1986;Hồ Thế Huy|1985;Mai Văn Thân|1985;Lê Bá Cung|1984;Nguyễn Văn Duy|1984;Trần Ngọc Hòa|1973;Sơn Kiên|1971;Võ Anh Tuấn|1971;Trương Anh Tuấn|1988;Huỳnh Thế Hiển|1988;Nguyễn Anh Khoa|1994;Phạm Hồng Lê|1974;Lê Trung Uẩn|1989;Nguyễn Quốc Trung|1976;Đặng Công Anh|1987;Nguyễn Quốc Hùng|1988;Nguyễn Trần Thế|1993;Đinh Hữu Jét|1992;Nguyễn Quốc Huy|1997;Nguyễn Phước Minh|1986;Chau Rốt Thia Ny|1995;Trương Thị Diệu Trâm|1999;Đinh Thị Tuyết Trinh|1996;Nguyễn Văn Minh Trí|1997;Nguyễn Ngọc Duy|1990;Phan Tấn Phong|1994;Nguyễn Văn Vũ|1994;Phạm Hoàng Kiệt|2003;Lương Việt Hoàng|2003"],
  ["n4-cty", "Công ty", "Phòng Vật tư – XNK", "Lê Bá Định|1968;Ngô Thị Hương Giang|1980;Đỗ Thanh Hà|1977;Nguyễn Thị Phương Đào|1974;Bùi Nguyễn Phương Anh|1993;Phạm Anh Tuấn|1985;Bùi Vũ Khanh|1987;Mai Văn Sơ|1981;Trương Vĩnh Phúc|1989;Lê Hồng Vũ|1988;Nguyễn Văn Thanh|1977;Nguyễn Thanh Bình|1976;Trần Lê Minh Chí|1981;Hồ Đắc Khiêm|1969;Phạm Văn Dũ|1965;Phạm Bá Hoàng|1992;Lâm Sơn Cao|1972;Ngô Quang Tường Khánh|2001"],
  ["n4-cty", "Công ty", "Phòng Kinh doanh", "Trương Minh Phú|1989;Lê Đình Toàn|1986;Nguyễn Lê Xuân Lan|1986;Lê Thị Bích Hòa|1983;Trần Hoàng Vũ|1982;Lê Mỹ Dung|1991;Bùi Thị Tuyết Mai|1997;Lê Đặng Thu Thảo|1997;Huỳnh Bé Chín|1979;Lâm Thị Thu Sáu|1983;Ngô Trung Quân|1995"],
  ["n4-cty", "Công ty", "Phòng Kế toán", "Trần Ngọc Hùng|1979;Lý Thị Kim Trúc|1988;Trương Thị Việt Nga|1975;Nguyễn Thu Hiền|1970;Bùi Hoài Phương|1984;Trần Nguyễn Thị Minh Châu|1993;Trần Thị Thanh Thanh|1996;Nguyễn Thị Liên|1987"],

  ["n4-nm", "Nhà máy", "Nghiệp vụ", "Nguyễn Ngọc Thảo|1977;Huỳnh Thị Bích Vân|1979;Nguyễn Thị Xinh|1980;Lê Hoàng Ly Linh|1992;Lê Đặng Trí Hiếu|1978"],
  ["n4-nm", "Nhà máy", "Điều hành", "Lê Thanh Hiền|1977;Lâm Thanh Tuấn|1976;Ngô Văn Phong|1983;Nguyễn Hồng Yên|1981;Nguyễn Văn Lưu|1968"],
  ["n4-nm", "Nhà máy", "Bảo vệ", "Lê Văn Chiến|1968;Bùi Thanh Điền|1978;Nguyễn Thanh Hồng|1973;Nguyễn Công Minh|1970;Nguyễn Văn To|1976;Nguyễn Hoàng Thuận|1983;Trần Văn Liên|1970;Nguyễn Hồng Sơn|1971;Nguyễn Quốc Việt|1967;Nguyễn Phương Bình|1973;Nguyễn Thế Thái|1966;Trần Trọng Nam|1990;Nguyễn Tuấn Kiệt|1985;Phạm Minh Trí|1990;Trương Hữu Quốc|1974;Nguyễn Thành Sơn|1977;Nguyễn Bá Sum|1974;Phạm Hào Kiệt|1984;Lê Ngọc Dũng|1970;Trần Trung Hòa|1977;Nguyễn Hoài Tâm|1985"],
  ["n4-nm", "Nhà máy", "Cấp dưỡng", "Trần Thị Như Tuyết|1981;Nguyễn Thị Phủ Hoài|1970;Trần Ngọc Anh|1986;Nguyễn Thị Mai|1975;Nguyễn Thị Hồng Vân|1992;Lê Phương Tím|1985;Ngô Thị Thu Diễm|1992;Trần Kim Loan|1975;Trần Thị Diễm Thúy|1977;Lê Thị Thu Hà|1976;Huỳnh Thị Út Nhỏ|1988;Phan Thu Nga|1984;Phạm Thị Phượng|1978;Nguyễn Thị Chúc Thơ|1990"],
  ["n4-nm", "Nhà máy", "Lồng bao", "Nguyễn Tấn Thanh|1969;Nguyễn Thị Mỹ Hoa|1974;Nguyễn Thị Hương|1971;Lê Thị Tuyết|1990;Nguyễn Thị Liền|1983;Võ Thị Dương|1991;Trần Trọng Tăng|1987;Lê Thị Ánh Chi|1990;Lê Thị Hồng Vân|1992;Nguyễn Thị Bích Nga|1978;Lê Thị Ánh Thi|2001;Bùi Thị Tuyền|1972"],
  ["n4-nm", "Nhà máy", "Kho VT-BB", "Lê Văn Thịnh|1966;Nguyễn Văn Thành|1977;Thân Trọng Tuấn|1972;Võ Thanh Nhàn|1976;Phạm Minh Kha|2000;Trần Tuyết Trinh|1973"],
  ["n4-nm", "Nhà máy", "Kho TP", "Văn Viết Hải|1979;Trần Thanh Nhàn|1967;Trần Ngọc Mùi|1995;Đặng Phước Long|1968"],
  ["n4-nm", "Nhà máy", "Xử lý nguyên liệu", "Huỳnh Thanh Dũng|1970;Cao Thanh Sang|1989;Kiều Văn Đực Nhỏ|1970;Võ Quang Khải|1968;Lê Minh Tâm|1965;Lê Văn Sáu|1968;Huỳnh Thành Quốc|1965;Cao Bảnh Hùng|1968;Võ Văn Thiên Nhạn|1968;Nguyễn Văn Phụng|1970;Ngô Văn Xe|1967"],
  ["n4-nm", "Nhà máy", "Vệ sinh công nghiệp", "Phan Văn Liến|1967;Nguyễn Văn Tần|1964;Phạm Việt Hùng|1965;Diệp Đình Phương|1968;Nguyễn Văn Rì|1965;Ngô Văn Chính|1971;Trương Văn Cẩn|1965;Nguyễn Thị Sang|1980;Trần Thị Tím|1982;Lê Thị Thận|1976;Nguyễn Tiến Tài|1993;Lê Hoàng Quân|1975;Trương Ngọc Quân|1971"],
  ["n4-nm", "Nhà máy", "Xe nâng", "Nguyễn Tấn Thành|1974;Trương Khắc Lâm|1976"],
  ["n4-nm", "Nhà máy", "Sản xuất – Tổ Lượng", "Bùi Văn Tuyến|1970;Trương Chí Cường|1991;Lê Văn Kiệt|2005;Võ Ngọc Quang Anh|1988;Phạm Mạnh Tiến|2000"],
  ["n4-nm", "Nhà máy", "Sản xuất – Tổ Luân", "Nguyễn Huy Hoàng|1990;Nguyễn Ngọc Duy|2002;Huỳnh Hữu Hơn|2003;Nguyễn Duy Khang|2002;Lê Thanh Phong|1971;Nguyễn Phúc Tiền|1986;Huỳnh Trọng Nhân|2004"],
  ["n4-nm", "Nhà máy", "Sản xuất – Tổ Phúc", "Trần Bảo Điền|1981;Đoàn Hữu Thắng|2002;Lê Khánh|2002;Nguyễn Trần Phong|2004;Nguyễn Hữu Phước|2001;Nguyễn Phan Hoàng Tuấn|1993;Trần Phong Huy|1998"],
  ["n4-nm", "Nhà máy", "Sản xuất – Tổ Quang Tuấn", "Nguyễn Thanh Thế|1991;Hoàng Văn Dùng|1996;Nguyễn Thành Trung|1981;Trần Huỳnh Đại Nghĩa|1999;Cao Hoàng Quí|2004;Ngô Minh Tiến|1985"],
  ["n4-nm", "Nhà máy", "Sản xuất – Tổ Gia Anh", "Võ Tấn Tài|1974;Nguyễn Văn Linh|2001;Nguyễn Văn Chiến|1975;Lê Quân Nhân|2000;Hồ Gia Kiệt|2005;Phạm Văn Lực|2002;Đặng Văn Tám|1983;Hàng Minh Dũng|1994"],
  ["n4-nm", "Nhà máy", "Sản xuất – Tổ Mỹ", "Nguyễn Minh Hiền|1993;Huỳnh Thanh Đông|1987;Nguyễn Văn Long|1989;Nguyễn Chánh Trung|1984;Nguyễn Thanh Liêm|1992"],
  ["n4-nm", "Nhà máy", "Sản xuất – Tổ Sĩ", "Nguyễn Tấn Phương|1979;Đoàn Văn Nghĩa|1995;Hồ Minh Nhân|1991;Nguyễn Tuấn Thanh|1982"],
  ["n4-nm", "Nhà máy", "Sản xuất – Tổ Tân", "Nguyễn Hữu Nghị|1985;Trần Văn Đông|1979;Phan Hoài Linh|1996;Nguyễn Ngọc Nhanh|1991;Huỳnh Văn Ngọt|1986;Lý Tấn Lộc|1970"],
  ["n4-nm", "Nhà máy", "Sản xuất – Tổ Quốc Tuấn", "Hồ Tấn Long|1983;Lâm Đức Trung|1989;Lưu Hữu Lịnh|1996;Nguyễn Huỳnh Tấn Duy|2000;Kim Bá Đạt|1999;Trần Chí Hiếu|2003;Nguyễn Thanh Nhân|2006;Lâm Hữu Lê|1994"],
  ["n4-nm", "Nhà máy", "Sản xuất – Tổ Tài", "Trần Quốc Hoàn|1985;Ngô Văn Ẩn|1998;Trần Ngọc Ta|1990;Nguyễn Tính Thành|2001;Huỳnh Tấn Lộc|1998;Bùi Thiên Phong|1991;Ngô Phú Quốc|1992;Tô Chí Hữu|1993"],
  ["n4-nm", "Nhà máy", "Sản xuất – Tổ Kỳ", "Phạm Minh Trí|1996;Lưu Văn Sang|1976;Phạm Đình Khoa|1983;Trang Văn Mười|1968;Đỗ Thành Trung|1978;Nguyễn Thành Được|1999;Hà Văn Luân|1997;Nguyễn Trường Sơn|1982"],
  ["n4-nm", "Nhà máy", "Sản xuất – Đóng bao", "Bùi Tấn Phong|2002;Nguyễn Quang Quy|2005;Huỳnh Trung Hiếu|2003;Hoàng Đức Trung|1979;Đặng Văn Thành|1990;Cao Thanh Bảo|1989;Trần Trọng Tuân|1985"],
];

export const TRAINEES: Trainee[] = RAW.flatMap(([s, unit, dept, list]) =>
  list.split(";").map(e => { const [name, y] = e.split("|"); return { s, unit, dept, name, born: y ? Number(y) : null }; }));
