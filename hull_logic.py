import json

import os
import math
import networkx as nx
import plotly.graph_objects as go
from collections import defaultdict

def pad_points(points, r=0.5):
    padded = []
    for x, y in points:
        padded.extend([(x-r, y-r), (x+r, y-r), (x-r, y+r), (x+r, y+r)])
    return padded

def convex_hull(points):
    points = sorted(list(set(points)))
    if len(points) <= 1: return points
    def cross(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower = []
    for p in points:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0: lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(points):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0: upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]
