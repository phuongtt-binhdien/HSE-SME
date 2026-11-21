# Tổng hợp tài liệu: Xử lý khí thải NH3 trong sản xuất phân bón & Mô hình lan truyền ô nhiễm Gaussian (ISC3)

**Ngày tổng hợp:** 20/11/2026  
**Mục đích:** Cung cấp dữ liệu kỹ thuật, hệ số phát thải, công nghệ xử lý và mô hình Gauss để phát triển App tính toán phát thải và lan truyền ô nhiễm NH3/PM từ nhà máy phân bón.

---

## 1. Công nghệ xử lý khí thải NH3 & PM mới (Toyo WESP + Scrubber)

**Nguồn:** Toyo Engineering – “Toyo’s novel high-efficiency and low-cost scrubbing technology” (Nitrogen + Syngas 2024, pilot tại PVCFC Cà Mau, Việt Nam)

### Điểm nổi bật
- Tích hợp **Wet Electrostatic Precipitator (WESP)** + scrubber nước của TOYO.
- Đạt **< 5 mg/Nm³** urea dust (tiêu chuẩn khắt khe nhất hiện nay).
- Áp suất tổn thất tổng < 100 mmH₂O (rất thấp so với scrubber thông thường).
- Pilot test > 300 giờ tại nhà máy urea 2.385 MTPD (PVCFC).
- Hiệu suất tuân theo **Deutsch equation**:

$$
\eta = 1 - e^{-\frac{\omega \times A}{Q}}
$$

Trong đó:
- \(\eta\): hiệu suất thu bụi
- \(\omega\): migration velocity (m/s) – tham số quan trọng để thiết kế
- \(A\): diện tích thu (m²)
- \(Q\): lưu lượng khí (m³/s)

### Ưu điểm thiết kế
- Có thể lắp WESP trực tiếp trên scrubber (tiết kiệm diện tích) hoặc sau ID Fan.
- Vận tốc khí linh hoạt, migration velocity gần như không đổi.
- CAPEX giảm khi tăng vận tốc, OPEX tăng (tối ưu hóa CAPEX+OPEX).
- Phù hợp revamp nhà máy urea hiện hữu.

**Kết luận ứng dụng App:** Có thể dùng làm benchmark công nghệ xử lý hiện đại cho urea dust + NH3.

---

## 2. Hệ số phát thải EPA AP-42 (Inorganic Chemical Industry)

### 2.1 Urea (Section 8.2)

**Phát thải chính:** NH₃ và Particulate Matter (urea dust).

| Công đoạn | PM Uncontrolled (kg/Mg) | PM Controlled (kg/Mg) | NH₃ Uncontrolled (kg/Mg) | NH₃ Controlled |
|-----------|--------------------------|------------------------|---------------------------|----------------|
| Solution formation & concentration | 0.0105 | ND | 9.23 | ND |
| Nonfluidized bed prilling (Agricultural) | 1.9 | 0.032 | 0.43 | ND |
| Fluidized bed prilling (Agricultural) | 3.1 | 0.39 | 1.46 | ND |
| Drum granulation | 120 | 0.115 | 1.07 | ND |
| Rotary drum cooler | 3.89 | 0.10 | 0.0256 | ND |

**Ghi chú:**
- Scrubber ướt là công nghệ kiểm soát chuẩn (tái chế urea hòa tan).
- Controlled factors dựa trên wet entrainment scrubber hoặc fiber filter.

### 2.2 Ammonium Nitrate (Section 8.3)

| Công đoạn | PM Uncontrolled (kg/Mg) | NH₃ Uncontrolled (kg/Mg) |
|-----------|--------------------------|---------------------------|
| Neutralizer | 0.045–4.3 | 0.43–18.0 |
| High density prill tower | 1.59 | 28.6 |
| Rotary drum granulator | 146 | 29.7 |
| Low density prill cooler | 25.8 | 0.15 |

**Lưu ý:** Scrubber ướt đạt hiệu suất cao (99.9% với granulator).

### 2.3 Synthetic Ammonia (Section 8.1)

Phát thải từ:
- Desulfurization regeneration: CO, SO₂, TOC
- CO₂ regenerator: NH₃ ≈ 1.0 kg/Mg, CO₂ rất lớn (1220 kg/Mg)
- Condensate steam stripper: NH₃ ≈ 1.1 kg/Mg

### 2.4 Ammonium Sulfate & Ammonium Phosphate
- Ammonium sulfate: chủ yếu từ dryer + scrubber.
- Ammonium phosphate: offgas ammonia-rich đi qua wet scrubber (primary dùng acid + raw material, secondary dùng pond water).

---

## 3. Australian NPI – Emission Estimation Technique Manual for Urea Manufacturing (2004)

Tương thích với AP-42, có thêm:
- Emission factors PM₁₀ và NH₃ (kg/tonne)
- Phương pháp ước tính: Direct measurement, Mass balance, Emission factors, Engineering calculation.
- Equation 8 (Emission Factor):

$$
E_{kpy,i} = [A \times OpHrs] \times EF_i \times [1 - (CE_i/100)]
$$

- Ví dụ tính NH₃ từ fluidized bed prilling agricultural: EF = 1.46 kg/t.

---

## 4. Mô hình lan truyền ô nhiễm Gaussian – EPA ISC3 (Volume II, 1995)

**Nguồn chuẩn quốc tế** cho mô hình Gaussian plume trong ISCST3 / ISCLT3.

### 4.1 Phương trình Gaussian cơ bản (Point Source – Short Term)

$$
C = \frac{Q \cdot K \cdot V \cdot D}{2\pi u_s \sigma_y \sigma_z} \exp\left[-0.5\left(\frac{y}{\sigma_y}\right)^2\right]
$$

**Ký hiệu:**
- \(C\): nồng độ (µg/m³)
- \(Q\): lưu lượng phát thải (g/s)
- \(K\): hệ số quy đổi (mặc định 1×10⁶)
- \(V\): Vertical Term (phản xạ mặt đất + mixing height)
- \(D\): Decay Term (phân hủy hóa học)
- \(u_s\): tốc độ gió tại chiều cao ống khói (m/s)
- \(\sigma_y, \sigma_z\): hệ số phân tán ngang & đứng (m) – theo Pasquill-Gifford hoặc Briggs

### 4.2 Các thành phần quan trọng cần implement trong App

1. **Wind Speed Profile** (Power law):
   $$
   u_s = u_{ref} \left(\frac{h_s}{z_{ref}}\right)^p
   $$
   - \(p\) theo stability class (Rural/Urban) – Bảng mặc định A–F.

2. **Stack-tip Downwash**:
   $$
   h_s' = h_s + 2d_s\left(\frac{v_s}{u_s} - 1.5\right) \quad (v_s < 1.5 u_s)
   $$

3. **Plume Rise (Briggs)**:
   - Buoyancy flux \(F_b\), Momentum flux \(F_m\)
   - Crossover buoyancy vs momentum
   - Final rise distance \(x_f\)

4. **Dispersion Parameters \(\sigma_y, \sigma_z\)**:
   - Pasquill-Gifford (rural)
   - Briggs / McElroy-Pooler (urban)
   - Có bảng hệ số theo stability class A–F và khoảng cách.

5. **Vertical Term \(V\)**:
   - Phản xạ mặt đất (multiple image method)
   - Mixing height limited
   - Dry deposition (optional)

6. **Stability Classes**: Pasquill A–F (A rất không ổn định → F rất ổn định)

### 4.3 Gợi ý triển khai App
- Input: Q (g/s), Hs, Vs, Ts, Ds, Met data (u, direction, stability, mixing height)
- Tính \(\sigma_y, \sigma_z\) theo khoảng cách x
- Tính plume rise → He (effective height)
- Áp dụng Vertical Term với reflection
- Output: nồng độ tại receptor (x, y, z)

**Lưu ý:** ISC3 là mô hình regulatory của EPA (trước AERMOD). Vẫn rất hữu ích cho App đơn giản, nhanh, dễ implement.

---

## 5. Khuyến nghị cho App phát triển

| Module | Dữ liệu dùng | Nguồn |
|--------|--------------|-------|
| Ước tính phát thải NH₃/PM | Emission factors AP-42 + NPI | EPA 8.2, 8.3, Australian Manual |
| Công nghệ xử lý | Hiệu suất WESP + scrubber | Toyo 2024 paper |
| Lan truyền ô nhiễm | Gaussian ISC3 + Briggs plume rise | EPA ISC3 Vol II |
| Đơn vị | kg/Mg hoặc kg/t sản phẩm | Chuẩn quốc tế |

**File này có thể dùng trực tiếp làm knowledge base cho App.**

---

**Tài liệu gốc đã xử lý:**
- Toyo WESP paper (2024)
- EPA AP-42: 8.1 Ammonia, 8.2 Urea, 8.3 Ammonium Nitrate, 8.4 Ammonium Sulfate, 8.5.3 Ammonium Phosphate, 8.13 Sulfur Recovery
- Australian NPI Urea Manual (2004)
- EPA ISC3 Volume II – Description of Model Algorithms (1995)
