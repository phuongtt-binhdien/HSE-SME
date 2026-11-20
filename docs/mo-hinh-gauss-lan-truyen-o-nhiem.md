# Mô hình Lan truyền Ô nhiễm Không khí Gauss (Gaussian Plume Model)

**Tài liệu tổng hợp dành cho phát triển App tính toán lan truyền ô nhiễm**  
*Cập nhật: 2026-11-20*  
*Dựa trên các nguồn mở, EPA, Briggs (1973), Pasquill-Gifford và các triển khai open-source.*

---

## 1. Giới thiệu

Mô hình Gauss (Gaussian Plume Model) là mô hình toán học phổ biến nhất để ước tính nồng độ chất ô nhiễm không khí từ nguồn điểm liên tục (stack, ống khói, nguồn thải nhà máy) trong điều kiện địa hình phẳng, gió ổn định.

**Giả định chính:**
- Nguồn thải liên tục, ổn định.
- Gió thổi theo hướng x với vận tốc không đổi \( u \).
- Phân bố nồng độ theo phương y (ngang) và z (đứng) tuân theo phân phối chuẩn Gauss.
- Không có phản ứng hóa học, lắng đọng hoặc biến đổi trong khoảng cách gần-trung bình (thường < 10-20 km).
- Địa hình phẳng, không có địa hình phức tạp.

Mô hình phù hợp cho App đánh giá nhanh tác động môi trường, kiểm tra tuân thủ QCVN, hoặc mô phỏng sơ bộ từ nhà máy phân bón (NH3, bụi, SO2, NOx...).

---

## 2. Công thức chính

### 2.1. Nồng độ tại điểm bất kỳ (có phản xạ mặt đất)

\[
C(x, y, z) = \frac{Q}{2 \pi u \sigma_y \sigma_z} \exp\left( -\frac{y^2}{2 \sigma_y^2} \right) \left[ \exp\left( -\frac{(z - H)^2}{2 \sigma_z^2} \right) + \exp\left( -\frac{(z + H)^2}{2 \sigma_z^2} \right) \right]
\]

### 2.2. Nồng độ mặt đất (z = 0) - Công thức thường dùng nhất

\[
C(x, y, 0) = \frac{Q}{\pi u \sigma_y \sigma_z} \exp\left( -\frac{y^2}{2 \sigma_y^2} \right) \exp\left( -\frac{H^2}{2 \sigma_z^2} \right)
\]

### 2.3. Nồng độ trên trục gió (y = 0, z = 0)

\[
C(x, 0, 0) = \frac{Q}{\pi u \sigma_y \sigma_z} \exp\left( -\frac{H^2}{2 \sigma_z^2} \right)
\]

**Định nghĩa biến số:**

| Ký hiệu | Ý nghĩa | Đơn vị |
|---------|---------|--------|
| \( C \) | Nồng độ chất ô nhiễm | g/m³ hoặc μg/m³ |
| \( Q \) | Lưu lượng phát thải nguồn | g/s |
| \( u \) | Vận tốc gió tại chiều cao hiệu dụng | m/s |
| \( x \) | Khoảng cách xuôi gió | m |
| \( y \) | Khoảng cách ngang gió (vuông góc hướng gió) | m |
| \( z \) | Chiều cao điểm nhận | m |
| \( H \) | Chiều cao hiệu dụng nguồn (stack height + plume rise) | m |
| \( \sigma_y \) | Hệ số phân tán ngang (horizontal dispersion) | m |
| \( \sigma_z \) | Hệ số phân tán đứng (vertical dispersion) | m |

> **Lưu ý đơn vị:** Đảm bảo nhất quán. Nếu Q tính bằng g/s, C ra g/m³. Nhân 10^6 để ra μg/m³.

---

## 3. Hệ số phân tán \(\sigma_y\) và \(\sigma_z\) (Briggs 1973)

Công thức Briggs là dạng giải tích phổ biến nhất cho tính toán máy tính, dựa trên Pasquill-Gifford.

**x tính bằng mét.**

### 3.1. Điều kiện nông thôn / đồng bằng (Rural / Open Country)

| Lớp ổn định | \(\sigma_y\) (m) | \(\sigma_z\) (m) |
|-------------|------------------|------------------|
| **A** (rất không ổn định) | \( 0.22 x (1 + 0.0001 x)^{-0.5} \) | \( 0.20 x \) |
| **B** (không ổn định vừa) | \( 0.16 x (1 + 0.0001 x)^{-0.5} \) | \( 0.12 x \) |
| **C** (ít không ổn định) | \( 0.11 x (1 + 0.0001 x)^{-0.5} \) | \( 0.08 x (1 + 0.0002 x)^{-0.5} \) |
| **D** (trung tính) | \( 0.08 x (1 + 0.0001 x)^{-0.5} \) | \( 0.06 x (1 + 0.0015 x)^{-0.5} \) |
| **E** (ít ổn định) | \( 0.06 x (1 + 0.0001 x)^{-0.5} \) | \( 0.03 x (1 + 0.0003 x)^{-1} \) |
| **F** (ổn định) | \( 0.04 x (1 + 0.0001 x)^{-0.5} \) | \( 0.016 x (1 + 0.0003 x)^{-1} \) |

### 3.2. Điều kiện đô thị / công nghiệp (Urban)

| Lớp ổn định | \(\sigma_y\) (m) | \(\sigma_z\) (m) |
|-------------|------------------|------------------|
| **A-B** | \( 0.32 x (1 + 0.0004 x)^{-0.5} \) | \( 0.24 x (1 + 0.001 x)^{0.5} \) |
| **C** | \( 0.22 x (1 + 0.0004 x)^{-0.5} \) | \( 0.20 x \) |
| **D** | \( 0.16 x (1 + 0.0004 x)^{-0.5} \) | \( 0.14 x (1 + 0.0003 x)^{-0.5} \) |
| **E-F** | \( 0.11 x (1 + 0.0004 x)^{-0.5} \) | \( 0.08 x (1 + 0.0015 x)^{-0.5} \) |

> Công thức chỉ đáng tin cậy trong khoảng 100 m – 10 km. Ngoài phạm vi này cần thận trọng hoặc dùng mô hình nâng cao (AERMOD, CALPUFF).

---

## 4. Phân loại độ ổn định khí quyển (Pasquill-Gifford)

| Lớp | Mô tả | Điều kiện điển hình |
|-----|-------|---------------------|
| **A** | Rất không ổn định | Ngày nắng mạnh, gió nhẹ (<2 m/s) |
| **B** | Không ổn định vừa | Ngày nắng vừa, gió nhẹ-trung bình |
| **C** | Ít không ổn định | Ngày mây nhẹ hoặc nắng yếu |
| **D** | Trung tính | Ngày mây dày, hoặc đêm gió mạnh; overcast |
| **E** | Ít ổn định | Đêm mây nhẹ, gió trung bình |
| **F** | Ổn định | Đêm trời quang, gió nhẹ |

**Gợi ý chọn lớp (đơn giản hóa):**
- Ngày nắng, gió < 2 m/s → A hoặc B
- Ngày nắng, gió 2-5 m/s → B hoặc C
- Mây hoặc đêm gió mạnh → D
- Đêm trời quang, gió nhẹ → E hoặc F

---

## 5. Chiều cao hiệu dụng nguồn (H)

\[
H = h_s + \Delta h
\]

Trong đó:
- \( h_s \): Chiều cao ống khói thực tế (m)
- \( \Delta h \): Độ nâng luồng khói (plume rise)

**Công thức Briggs đơn giản cho plume rise (đối với nguồn nóng):**

\[
\Delta h = \frac{1.6 F^{1/3} x^{2/3}}{u} \quad \text{(trong khoảng gần)}
\]

Với flux nổi \( F = \frac{g v_s d^2 (T_s - T_a)}{4 T_s} \)

- \( g = 9.81 \) m/s²
- \( v_s \): vận tốc khí thoát (m/s)
- \( d \): đường kính ống khói (m)
- \( T_s, T_a \): nhiệt độ khí thải và không khí (K)

Đối với App đơn giản, có thể cho phép người dùng nhập trực tiếp H hoặc bỏ qua plume rise nếu nguồn lạnh/áp suất thấp.

---

## 6. Gợi ý triển khai trong App

### Input cần thiết:
1. Q (g/s) – hoặc tính từ nồng độ × lưu lượng khí thải
2. u (m/s)
3. H (m)
4. Lớp ổn định (A-F) hoặc chọn rural/urban
5. Khoảng cách x, y (hoặc grid để vẽ contour)
6. Chiều cao điểm nhận z (thường = 0 hoặc 1.5 m)

### Output:
- Nồng độ tại điểm (μg/m³ hoặc mg/m³)
- Bản đồ contour nồng độ (heatmap)
- Khoảng cách nồng độ cực đại mặt đất
- So sánh với QCVN 05:2023/BTNMT hoặc tiêu chuẩn nhà máy

### Lưu ý kỹ thuật:
- Tránh chia cho 0 khi x ≈ 0 (đặt ngưỡng tối thiểu x_min = 10-50 m)
- Dùng đơn vị nhất quán
- Có thể thêm hệ số decay hoặc deposition nếu cần nâng cao
- Open-source tham khảo:
  - https://github.com/gerritjandebruin/gaussian-plume (Python)
  - https://github.com/Hammerling-Research-Group/FastGaussianPuff (Gaussian Puff, nhanh hơn cho biến đổi theo thời gian)
  - https://github.com/koaandmud/GPM

---

## 7. Tài liệu tham khảo & Nguồn mở

- Briggs, G.A. (1973). Diffusion estimation for small emissions. ATDL Contribution File No. 79.
- Pasquill, F. & Gifford, F.A. – Các đường cong phân tán kinh điển.
- EPA AP-42 & AERMOD User Guide.
- Wikipedia: Atmospheric dispersion modeling.
- Các giáo trình Việt Nam: Trần Ngọc Chấn, Phạm Ngọc Đăng (cũ nhưng nền tảng tốt).
- GitHub repositories listed above.

---

## 8. Liên quan đến nhà máy phân bón & NH3

Đối với khí thải NH3 từ nhà máy phân bón (urea, ammonium nitrate, NPK granulator):
- Dùng mô hình Gauss để đánh giá nồng độ xung quanh sau khi xử lý bằng scrubber.
- Hiệu suất scrubber acid (H2SO4) thường đạt >99%, tạo ammonium sulfate tái sử dụng.
- Kết hợp emission factor từ EPA AP-42 Chapter 8 (Urea, Ammonium Nitrate) để ước tính Q đầu vào.

*File này có thể dùng trực tiếp làm cơ sở dữ liệu/công thức cho App.*
