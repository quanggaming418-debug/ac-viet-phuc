# Báo cáo Patch B1 — Gender as first-class UserIntent

Ngày nghiệm thu: 07/10/2026. Project hiện tại: Website Việt phục trên Google AI Studio, app c2a85092-8eec-440f-a0bf-c86628ef5060. Thực hiện trực tiếp trên React/Vite hiện có; không quay lại project Next.js/M2 cũ. Phạm vi chỉ B1. Trạng thái tổng thể: **PARTIAL**.

## A. Files được tạo/chỉnh sửa trong B1

- src/types/recommendation.ts
- src/types/imageGeneration.ts
- src/types/imageQA.ts
- src/utils/blueprintSpec.ts
- src/utils/buildImagePrompt.ts
- src/utils/buildRegeneratedPrompt.ts
- src/components/InputSection.tsx
- src/App.tsx
- src/components/ResultSection.tsx
- src/components/ImagePromptPanel.tsx
- src/components/ImageQAPanel.tsx
- src/services/imageQAService.ts
- server.ts
- scripts/test-b1-matrix.ts
- docs/PATCH_B1_REPORT.md

Không thay framework, package hoặc dependency. Danh mục trên là các file đã được xử lý trong B1; môi trường Studio không có Git repository để xuất diff tổng thể.

## B. Hiện trạng gender trước B1

Baseline grep không tìm thấy gender, selectedGender, modelGender, isMale, isFemale hoặc gender toggle ở Step 3 trong app hiện tại. Vì vậy không tuyên bố đã xóa một toggle vốn không tồn tại. B1 bổ sung wearerPresentation như dữ liệu đầu vào rõ ràng; không suy diễn rằng baseline đã gây ra lỗi ảnh hay sai lệch văn hóa khi chưa có chứng cứ.

## C. Canonical UserIntent

WearerPresentation chỉ có male | female | unspecified. App sở hữu một UserIntent controlled, mặc định unspecified. InputSection nhận giá trị và callback từ App, không giữ selectedWearer độc lập. Người mặc là lựa chọn styling/context, không phải quy tắc lịch sử giới hạn loại áo.

## D. Section 1

Thứ tự: mô tả nhu cầu → Người mặc (Nam/Nữ/Không ưu tiên) → dịp → phong cách → mức cách tân → Để AC gợi ý. Chip người mặc được chọn dùng nền đỏ gạch pastel; không dùng đen. Hệ màu chip dịp/phong cách và bố cục cũ được giữ. Ba lựa chọn người mặc đã kiểm tra trực tiếp trong preview. Không tuyên bố đã nghiệm thu accessibility toàn app; aria-pressed chưa có trên các chip.

## E. Recommendation

Request reasoning mang wearerPresentation từ UserIntent đã capture. App giữ request, recommendation, version và fingerprint của response được chấp nhận. Eligibility so sánh version/context fingerprint/wearer với live ref; không dùng trạng thái stale của bản phối cũ để cản việc nhận đề xuất mới hợp lệ. Refine giữ người mặc của request gốc; explicit unspecified không bị fallback sang female của recommendation.

## F. OutfitBlueprint

Blueprint nhận wearer từ request đã chấp nhận, giữ context fingerprint và có fingerprint riêng. Chỉ có ba garment: ngu_than_tay_chen, ao_tac, ao_tu_than. Phom nhận diện không thay theo wearer. Phụ kiện phân biệt vai trò core/blueprint-selected/optional; phụ kiện styling được đề xuất mang BLUEPRINT_SELECTED, không tự nâng thành bắt buộc lịch sử và không tự ép mũ/khăn thành core.

## G. VisualSpec

Spec capture wearer, version, context fingerprint, blueprint fingerprint cùng dịp/phong cách/modernity của request. Không fallback sang Tết hoặc 50 khi request đã chọn tốt nghiệp/65. Spec dùng làm nguồn cho compiler và dispatch; không lấy lại context mới của form khi render artifact cũ.

## H. Image prompt

Compiler dùng wearer từ VisualSpec: male → adult Vietnamese male model; female → adult Vietnamese female model; unspecified → adult Vietnamese model. Không ép unspecified thành một giới tính hoặc diện mạo androgynous. Preview hiện tại đã hiển thị prompt unspecified với mô tả chung, tốt nghiệp/65, và ràng buộc phom ngũ thân. Đây là chứng cứ prompt, chưa phải chứng cứ chất lượng ảnh.

## I. QA và correction

Trước QA dispatch, kiểm tra exact generation/image và full artifact snapshot, Spec, request wearer, version và provenance; thiếu hoặc lệch metadata thì chặn. Manual QA dùng Spec/request/recommendation của active artifact. Auto QA giữ cùng snapshot đã tạo ảnh. Correction/regen dùng parent snapshots; correctionSnapshot lấy trực tiếp từ input.visualSpec gồm wearerPresentation, contextVersion, contextFingerprint, blueprintFingerprint, visualSpecFingerprint và được lưu trên artifact mới.

QA coi lệch wearer rõ ràng là bám bản phối, không phải lỗi lịch sử; unspecified không áp một target binary. Không đổi Gemini QA response schema. Kết quả đến muộn phải qua eligibility và generation guard trước khi trở thành kết quả hiện hành. QA/correction live chưa chạy được vì chưa có ảnh render thành công.

## J. Fingerprints

Context fingerprint serialize các trường cố định, có wearer. Blueprint và VisualSpec fingerprints cũng có wearer. Test xác nhận cùng context/styling nhưng male/female/unspecified tạo ba fingerprint phân biệt. Guards từ chối thiếu provenance, sai context/BP/spec fingerprint hoặc thiếu live accepted fingerprint; không coi thiếu metadata là hợp lệ.

## K. Invalidation và race safety

Thay đổi intent thực sự cập nhật live ref và tăng version đồng bộ trước React setters; no-op giữ version. Các kết quả downstream cũ trở thành stale, không là current image/QA. Chỉ thay form không tự gọi AI. Thông báo: “Thông tin người mặc đã thay đổi. Hãy cập nhật lại bản phối để nhận đề xuất phù hợp.”

Request ownership token recommendation/refine được tách khỏi freshness; old finally không được giải phóng busy của request mới. Guard chạy trước dispatch và sau await. Ca ABA dùng version để từ chối response v1 khi form trở về cùng wearer ở v3. Helper/predicate tests đã đạt; mounted-App loading race integration vẫn PENDING.

## L. Artifact/history

Artifact mới lưu wearer/version/context/BP/spec fingerprints cùng deep snapshots BP/Spec/recommendation/request; artifact sửa có correctionSnapshot. Lịch sử phiên được giữ, không relabel artifact cũ. Ảnh cũ có thể xem trong lịch sử nhưng phải đạt eligibility mới được QA/sửa. Legacy artifact thiếu provenance bị chặn dispatch. Không sửa ID, ordering, grouping, version lịch sử, giới hạn/budget hiện có. Kiểm thử browser với lịch sử ảnh thành công vẫn PENDING.

## M. Tests và lệnh thực tế

| Lệnh | Kết quả cuối |
|---|---|
| npx tsx scripts/test-b1-matrix.ts | 18/18 PASS, exit 0 |
| npx tsx scripts/test-round-a-matrix.ts | 18/18 PASS, exit 0 |
| npx tsx scripts/test-3d-matrix.ts | 29/29 PASS, exit 0 |
| npx tsx scripts/test-multiview-matrix.ts | 24/24 PASS, exit 0 |
| npx tsx scripts/test-reconstruction-matrix.ts | 26/26 PASS, exit 0 |
| npx tsx scripts/test-meshy-matrix.ts | 27/27 PASS, exit 0 |
| Tổng | 142/142 PASS |

B1 tests gồm canonical/default, distinct fingerprints, exact context preservation, fail-closed provenance, stale/ABA rejection, deferred Promise gọi eligibility helpers thật, morphology ba áo, InputSection element handlers thật, accessory classification, server wearer resolver thật và correction compiler metadata thật.

Các matrix gồm unit/predicate/component-handler và mock fixtures. Request-token cleanup case là simulation; không phải mounted App integration. Không dùng dòng log PASS mô phỏng tương tác để khẳng định đã thử cử chỉ 3D/mobile trong browser. Mounted App deferred-response/loading/history integration và E2E ảnh thành công vẫn PENDING. Automated suites không gọi API trả phí; không bịa live result.

## N. Manual live preview

Dùng cùng mô tả tốt nghiệp, phong cách Thanh lịch và modernity 65:

1. Gửi Nam: recommendation thành công, badge “Phối cho: Nam”, concept “Tân thời học vị”, ngũ thân tay chẽn.
2. Bấm tạo ảnh một lần: AUTHENTICATION_FAILED — “Xác thực dịch vụ tạo ảnh không thành công. Khóa API có thể không hợp lệ hoặc đã hết hạn.” Không có ảnh mới, không có QA ảnh mới; không retry render.
3. Đổi sang Nữ: bản phối Nam cũ vẫn nhìn thấy, xuất hiện đúng stale message; generate/retry/refine bị vô hiệu hóa. Không tự gọi recommendation/render.
4. Gửi lại Nữ: thành công, badge “Phối cho: Nữ”, concept “Thanh Tân Học Lộ”; banner stale được gỡ, nút downstream mở lại.
5. Đổi sang Không ưu tiên: bản phối Nữ stale và downstream bị chặn. Gửi lại: thành công, badge “Không ưu tiên giới tính”, concept “Tốt nghiệp đương đại”. Prompt đã kiểm tra dùng adult Vietnamese model.

Đã thực hiện 3 lần submit recommendation live và 1 yêu cầu render live thất bại xác thực. Không tuyên bố không có real API calls. Lỗi HTML/devserver disconnect ở lượt trước không còn ngăn 3 lượt recommendation vừa kiểm tra; blocker render hiện tại là xác thực EvoLink. Chất lượng pixels, successful image history, live QA và live correction: **PENDING / chưa đánh giá**.

Ảnh bằng chứng lưu tại C:/Users/Windows/Downloads/AC_B1_Verification: b1-female-stale-ui.jpg, b1-render-blocked.jpg, b1-unspecified-prompt.jpg. Người dùng cần cập nhật credential EvoLink hợp lệ qua server Secrets để nghiệm thu tiếp; không gửi key qua chat. Chưa đọc, nhập hoặc thay credential trong B1.

## O. Regression và vùng khóa

124 regression matrix cases đạt. Bốn SHA-256 đối chiếu baseline khớp:

- src/services/timeoutConfig.ts: 1e4f833ce4bc5c26f5dfa4209071f7a7ef8b46adc5b728aac07ee52204a80d80
- src/utils/safeJson.ts: 1b32e117af3c4e7f6b4552ede3821fed20fcd1c1d84ac089d81964121adc35da
- src/utils/correlation.ts: 41e9c2d1f610f1c8ed9b3918977a28a8968073ad2cdbe94c8268fa637b255ad7
- public/models/ao-tac-proxy.glb: b9d773d2be385096f71761a4fa04d7c599bd2f70ddb4da6c901bb26279052065

Đây không phải bằng chứng byte-for-byte cho mọi vùng khóa; Studio không có Git diff tổng thể. Không sửa các vấn đề history/IDs/version/grouping cũ, transport lỗi non-JSON/timeout, provider/model/router, QA schema, budget, Round A coordinator/dedupe/correlation, 3D/MultiView/Reconstruction hay aspect ratio.

## P. Typecheck/build

npx tsc --noEmit: exit 0, không lỗi ở lần cuối. npm run build: exit 0, Vite 8.3.3, 1698 modules, built in 1.21s. Chunk main 648.57 kB, ThreeDViewer 665.35 kB; còn warning chunk lớn hơn 500 kB. Không sửa chunking ngoài phạm vi. Lỗi TypeScript fixture xuất hiện khi thêm test correction đã được sửa và toàn bộ gates đã chạy lại sau thay đổi code cuối. Cập nhật báo cáo cuối chỉ là tài liệu.

## Q. Ngoài phạm vi và vận hành

Không bắt đầu B2. Không đổi bố cục chung, stack, provider transport/timeout/model, Gemini response schema, regeneration budget hoặc các tính năng đã khóa. Không quay lại M2 cục bộ. B1 không thêm key/secret vào client; cấu hình credential tiếp tục ở server. Automated tests không gọi paid APIs; manual calls được ghi riêng ở N. Không publish/deploy/share hoặc đổi quyền truy cập. Không nghiệm thu source/asset lịch sử, không tuyên bố competition-ready. Không đánh giá chất lượng ảnh khi render chưa tạo ảnh.

## R. Trạng thái

**B1: PARTIAL.** Typecheck/build và 142 tests đạt; manual recommendation và stale/rebuild cho cả ba wearer đạt. Còn PENDING: mounted App deferred/loading/history integration, render thành công, live image history/QA/correction và chất lượng ảnh thực tế. Blocker cụ thể: EvoLink AUTHENTICATION_FAILED. Dừng ở B1; không tự sửa provider transport hoặc bắt đầu B2.
