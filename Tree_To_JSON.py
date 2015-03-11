__author__ = 'dsx'

import os
import json


def path_to_dict(path, exclude_dirs=None, image_depth=2):
	"""
	Based on http://stackoverflow.com/questions/25226208/represent-directory-tree-as-json
	:param path:
	:param exclude_dirs: an iterable of folders to exclude
	:param exclude_patterns:
	:return:
	"""

	if exclude_dirs is None:
		exclude_dirs = []


	d = {'name': os.path.basename(path)}
	if os.path.isdir(path) and os.path.basename(path) not in exclude_dirs:
		print os.path.basename(path)
		d['children'] = [path_to_dict(os.path.join(path, x), exclude_dirs=exclude_dirs, image_depth=image_depth) for x in os.listdir(path)]

		# Panotour Specific Checks! basically, we're going to check if this current folder is one of the image containers, and then if it has children that are in the range we want
		# Panotour outputs a folder structure with folders 1-5 that each have folders named 1-5 inside of them, but we need 1-{image_depth} in each of the subfolders, so that's what this
		# code is trying to pull out.
		try:
			if image_depth and int(d['name']) in range(100):  # if the folder
				new_list = []
				for item in d['children']:
					if not(int(item['name']) in range(100) and int(item['name']) > image_depth):  # if this item is also an integer and in the limit of depth we want to go into
						new_list.append(item)
				d['children'] = new_list
		except ValueError:
			pass  # will be raised when we pass strings that aren't numbers into int() - expected
	return d


def path_to_list(path, exclude_dirs=None, image_depth=2):
	if exclude_dirs is None:
		exclude_dirs = []

	final_list = [path, ]
	if os.path.isdir(path) and os.path.basename(path) not in exclude_dirs:
		print os.path.basename(path)
		new_contents = [path_to_list(os.path.join(path, x), exclude_dirs=exclude_dirs, image_depth=image_depth) for x in os.listdir(path)]

		try:
			if image_depth and os.path.basename(path) in range(200):  # if the folder
				new_list = []
				for item in new_contents:
					if not(int(os.path.basename(item)) in range(200) and int(os.path.basename(item)) > image_depth):  # if this item is also an integer and in the limit of depth we want to go into
						new_list.append(item)
				final_list = new_list
			else:
				final_list = new_contents
		except ValueError:
			pass

	return final_list


def path_to_json(path, output_file, image_depth=1):
	with open(output_file, 'wb') as filehandle:
		filehandle.write(json.dumps(path_to_dict(path, exclude_dirs=["html5", "mobile", "tablet", ".git", "preload.js"], image_depth=image_depth)))