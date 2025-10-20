# https://torchgeo.readthedocs.io/en/stable/user/installation.html 
import os
import tempfile

import kornia.augmentation as K
import torch
from torch import nn, optim
from torch.utils.data import DataLoader

from torchgeo.datasets import EuroSAT100
from torchgeo.models import ResNet18_Weights, resnet18, CopernicusFM

torch.manual_seed(0)


model = CopernicusFM()
varname = 'Sentinel 5P Nitrogen Dioxide' # variable name (as input to a LLM for langauge embed)
x = torch.randn(1, 1, 56, 56) # input image
metadata = torch.full((1, 4), float('nan')) # [lon (degree), lat (degree), delta_time (days since 1970/1/1), patch_token_area (km^2)], assume unknown
language_embed = torch.randn(2048) # language embedding: encode varname with a LLM (e.g. Llama)
kernel_size = 4 # expected patch size
input_mode = 'variable'
logit = model(x, metadata, language_embed=language_embed, input_mode=input_mode, kernel_size=kernel_size)
print(logit.shape)