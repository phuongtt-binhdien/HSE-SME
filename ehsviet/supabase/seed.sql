-- ============================================================
-- EHSViet — Dữ liệu mẫu (tổ chức demo theo bối cảnh nhà máy phân bón)
-- Chạy SAU schema.sql, trong SQL Editor (service role — bỏ qua RLS).
-- Sau khi tạo tài khoản đăng nhập đầu tiên, gán vào tổ chức demo bằng lệnh
-- ở CUỐI file này.
-- ============================================================

insert into public.organizations (id, name, tax_code, plan) values
('11111111-1111-1111-1111-111111111111', 'Công ty CP Phân bón Bình Điền (Demo)', null, 'pro');

insert into public.facilities (id, org_id, name, address, gpmt_number, gpmt_issuer, gpmt_issued_date, gpmt_expiry) values
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
 'Nhà máy Phân bón Bình Điền – Long An', 'CCN Long Định – Long Cang, xã Long Cang, tỉnh Tây Ninh',
 '2986/GPMT-STNMT', 'Sở TN&MT Long An (nay: Sở NN&MT Tây Ninh)', '2023-04-28', '2033-04-27');

-- ---------- Danh mục chất thải (mã CTNH theo TT 02/2022/TT-BTNMT) ----------
insert into public.waste_types (org_id, facility_id, code, name, category, physical_state, unit, storage_location) values
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','17 02 03','Dầu động cơ, hộp số, bôi trơn thải','CTNH','long','kg','Kho CTNH'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','18 02 01','Giẻ lau, vải bảo vệ nhiễm thành phần nguy hại','CTNH','ran','kg','Kho CTNH'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','16 01 06','Bóng đèn huỳnh quang thải','CTNH','ran','kg','Kho CTNH'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','18 01 01','Bao bì mềm thải nhiễm thành phần nguy hại','CTNH','ran','kg','Kho CTNH'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',null,'Chất thải rắn công nghiệp thông thường','CTRCNTT','ran','kg','Bãi tập kết CTR'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',null,'Chất thải rắn sinh hoạt','CTRSH','ran','kg','Điểm tập kết CTRSH');

insert into public.waste_contractors (org_id, name, license_no, scope, contact_person) values
('11111111-1111-1111-1111-111111111111','Công ty TNHH Môi trường Cao Gia Quý', null, 'Thu gom, vận chuyển, xử lý chất thải nguy hại', null),
('11111111-1111-1111-1111-111111111111','Công ty TNHH Môi trường Chân Lý', null, 'Thu gom, xử lý chất thải rắn công nghiệp thông thường', null);

-- ---------- Hệ thống xử lý & điểm quan trắc ----------
insert into public.treatment_systems (org_id, facility_id, name, kind, capacity, description) values
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','HTXLNT tập trung','nuoc_thai','120 m³/ngày đêm','Công nghệ Anoxic – MBBR – Aerotank; đầu ra đạt QCVN 40:2011/BTNMT cột A'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','Hệ thống lọc bụi túi vải – Tạo hạt 1 (TH1H)','khi_thai',null,'Ống khói cao 22 m theo GPMT 2986/GPMT-STNMT'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','Hệ thống lọc bụi túi vải – Tạo hạt 2 (TH2H)','khi_thai',null,null),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','Hệ thống lọc bụi túi vải – Tạo hạt 3 (TH3H)','khi_thai',null,'Ống khói cao 22 m theo GPMT 2986/GPMT-STNMT'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','Lò hơi + tháp hấp thụ','khi_thai',null,'Cyclone + tháp hấp thụ');

insert into public.monitoring_points (org_id, facility_id, name, kind, position) values
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','NT-01 Đầu ra HTXLNT','nuoc_thai','Hố ga sau xử lý, trước điểm xả'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','KT-01 Ống khói Tạo hạt 1','khi_thai','Ống khói H = 22 m'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','KT-02 Ống khói Tạo hạt 3','khi_thai','Ống khói H = 22 m'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','KT-03 Ống khói lò hơi','khi_thai',null);

-- ---------- Checklist mẫu ----------
insert into public.checklist_templates (org_id, facility_id, name, category, frequency, items) values
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
 'Kiểm tra thiết bị PCCC hàng tháng','PCCC','monthly',
 '[{"label":"Bình chữa cháy đủ số lượng, đúng vị trí, còn hạn kiểm định"},
   {"label":"Kim đồng hồ áp suất bình bột ở vạch xanh"},
   {"label":"Họng nước, lăng, vòi chữa cháy đầy đủ, không rò rỉ"},
   {"label":"Máy bơm chữa cháy khởi động tốt (chạy thử)"},
   {"label":"Hệ thống báo cháy tự động hoạt động bình thường"},
   {"label":"Đèn exit, đèn chiếu sáng sự cố hoạt động"},
   {"label":"Lối thoát nạn thông thoáng, không bị che chắn"},
   {"label":"Nội quy, tiêu lệnh PCCC đầy đủ, rõ ràng"},
   {"label":"Khu vực chứa hóa chất, nhiên liệu cách ly nguồn nhiệt"},
   {"label":"Hồ sơ phương án chữa cháy được cập nhật"}]'::jsonb),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
 'Kiểm tra vệ sinh công nghiệp hàng tháng','VSCN','monthly',
 '[{"label":"Mặt bằng nhà xưởng sạch, không tồn đọng nguyên liệu rơi vãi"},
   {"label":"Đường giao thông nội bộ sạch, không lầy lội"},
   {"label":"Mương rãnh thoát nước được nạo vét, không tắc nghẽn"},
   {"label":"Thùng rác phân loại đủ, đúng màu, có nhãn"},
   {"label":"Kho CTNH: nền chống thấm, có gờ chống tràn, biển cảnh báo"},
   {"label":"CTNH dán nhãn nhận diện đúng quy định"},
   {"label":"Khu vực sang chiết hóa chất có khay hứng, PATHH sẵn có"},
   {"label":"Không phát hiện rò rỉ dầu, hóa chất ra môi trường"}]'::jsonb);

-- ---------- Thiết bị PCCC mẫu ----------
insert into public.fire_equipment (org_id, facility_id, name, type, location, quantity, status) values
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','Bình bột ABC 8kg','binh_bot','Xưởng tạo hạt 1',6,'tot'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','Bình CO2 5kg','binh_co2','Phòng điện',4,'tot'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','Họng nước vách tường','hong_nuoc','Nhà xưởng chính',8,'tot'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','Máy bơm chữa cháy diesel','may_bom','Nhà bơm PCCC',1,'tot');

-- ---------- Hồ sơ pháp lý & lịch tuân thủ mẫu ----------
insert into public.legal_documents (org_id, facility_id, doc_no, title, category, issuer) values
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','2986/GPMT-STNMT','Giấy phép môi trường','GPMT','Sở TN&MT Long An (nay: Sở NN&MT Tây Ninh)'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',null,'Hợp đồng thu gom, xử lý CTNH','hop_dong','Ký với đơn vị có chức năng'),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',null,'Chứng nhận ISO 14001:2015','giay_phep',null);

insert into public.compliance_tasks (org_id, facility_id, title, description, category, due_date, recurrence, remind_days) values
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
 'Báo cáo công tác BVMT năm','Gửi Sở Nông nghiệp và Môi trường + Tập đoàn Hóa chất Việt Nam. Kiểm tra thời hạn theo quy định hiện hành (TT 02/2022/TT-BTNMT và văn bản sửa đổi).','bao_cao', (date_trunc('year', current_date) + interval '1 year' + interval '14 days')::date, 'yearly', 30),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
 'Quan trắc định kỳ nước thải, khí thải','Theo tần suất quy định tại GPMT 2986/GPMT-STNMT; phối hợp đơn vị tư vấn.','quan_trac', (date_trunc('quarter', current_date) + interval '3 months' - interval '10 days')::date, 'quarterly', 14),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
 'Kê khai, nộp phí BVMT đối với nước thải','Kê khai theo Nghị định 53/2020/NĐ-CP.','phi_le_phi', (date_trunc('quarter', current_date) + interval '3 months' + interval '9 days')::date, 'quarterly', 10),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
 'Tổng hợp phụ lục CTNH (tháng/năm)','Cập nhật sổ giao nhận, chứng từ CTNH phục vụ báo cáo.','bao_cao', (date_trunc('month', current_date) + interval '1 month' + interval '4 days')::date, 'monthly', 7),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222',
 'Diễn tập PCCC & ứng phó sự cố môi trường','Tổ chức thực tập phương án hằng năm, lưu biên bản đánh giá.','dao_tao', (date_trunc('year', current_date) + interval '9 months')::date, 'yearly', 30);

-- ---------- Hóa chất mẫu ----------
insert into public.chemicals (org_id, facility_id, name, storage_location, unit, pathh_available) values
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','PAC (Poly Aluminium Chloride)','Kho hóa chất HTXLNT','kg',true),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','Polymer anion','Kho hóa chất HTXLNT','kg',true),
('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','Chlorine (Ca(OCl)₂)','Kho hóa chất HTXLNT','kg',true);

-- ---------- Nhân sự, ESG, nội quy ----------
-- Chính sách – mục tiêu ESG, danh mục nội quy và checklist tự kiểm tra tuân thủ được nạp
-- trong ứng dụng: Cài đặt › "Bộ mẫu nghiệp vụ nhà máy phân bón NPK". Danh sách nhân sự và
-- lượt huấn luyện nhập tại Nhân sự & Huấn luyện › Nhập từ Excel.

-- ============================================================
-- BƯỚC CUỐI: gán tài khoản đăng nhập đầu tiên vào tổ chức demo.
-- 1) Tạo user trong Authentication > Users (hoặc đăng ký từ app).
-- 2) Lấy UUID của user, thay vào lệnh dưới rồi chạy:
--
-- insert into public.profiles (id, org_id, facility_id, full_name, role)
-- values ('<UUID-USER>', '11111111-1111-1111-1111-111111111111',
--         '22222222-2222-2222-2222-222222222222', 'Nguyễn Văn Phong', 'admin');
-- ============================================================
