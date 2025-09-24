# https://torchgeo.readthedocs.io/en/stable/user/installation.html 
import os
import tempfile

import kornia.augmentation as K
import torch
from torch import nn, optim
from torch.utils.data import DataLoader

from torchgeo.datasets import EuroSAT100
from torchgeo.models import ResNet18_Weights, resnet18

torch.manual_seed(0)


