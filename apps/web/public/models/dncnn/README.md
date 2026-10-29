# DnCNN model provenance

Original model: Kai Zhang's KAIR DnCNN, grayscale Gaussian denoising sigma 25, 17 convolution layers. MIT license included in LICENSE.txt.

- Original implementation/weights: https://github.com/cszn/KAIR
- Export publisher: https://huggingface.co/qualcomm/DnCNN
- Export release: v0.65.0, float ONNX, input/output [1,1,256,256], normalized grayscale.
- Download: https://qaihub-public-assets.s3.us-west-2.amazonaws.com/qai-hub-models/models/dncnn/releases/v0.65.0/dncnn-onnx-float.zip
- dncnn.onnx SHA256: 8737c82a848de49a3bff3456e61d1acef6f10238be1dddbdaf65279abfb060ee
- dncnn.data SHA256: 025034640eec75077202afb8bc12d96a2ed406ae09fd8833503700031e096406

The worker verifies both files before inference. No conversion or retraining was performed here. Source images are display RGB previews, not linear astronomical exposures. This general-photo model is not validated for scientific astronomical restoration. The application uses only a bounded fraction of the luminance correction and protects input-detected source regions. This limits changes but cannot guarantee preservation of all faint structures. Similarity metrics against the input are not proof of accuracy.
